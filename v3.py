#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <ESP8266HTTPUpdateServer.h>
#include <EEPROM.h>

const char* hostName = "Syra-Home-SYRA0156326";  // access http://Syra-Home-SYRA0156326.local
const char* serialNumber = "SYRA0156326";
const int EEPROM_SIZE = 512;
const int SSID_ADDR = 0;
const int PASS_ADDR = 32;

// OTA credentials (change these!)
const char* OTA_USER = "admin";
const char* OTA_PASS = "syra-ota-2026";

ESP8266WebServer server(80);
ESP8266HTTPUpdateServer httpUpdater;
bool mdnsRunning = false;

// LED and connection state
unsigned long lastBlink = 0;
const unsigned long BLINK_INTERVAL = 2000; // blinks every 2s
bool blinkEnabled = false;
unsigned long lastConnOk = 0;

// Simple device persistence
const int DEV_LIST_ADDR = 64;
const int DEV_MAX = 10;
const int DEV_NAME_LEN = 32; // bytes per name (includes terminator)
int deviceCount = 0;
String devices[DEV_MAX];

// Messaging (Bridge) in RAM
const int MSG_MAX = 20;
struct Msg { String to; String from; String body; unsigned long ts; bool used; };
Msg msgs[MSG_MAX];

// ---------- Utilities ----------
String sanitizeName(const String &s) {
  String out;
  out.reserve(DEV_NAME_LEN);
  for (size_t i = 0; i < s.length() && out.length() < DEV_NAME_LEN - 1; i++) {
    char c = s[i];
    if (isalnum((unsigned char)c) || c == ' ' || c == '-' || c == '_') {
      out += c;
    }
  }
  out.trim();
  return out;
}

void setLEDConnected(bool connected) {
  pinMode(LED_BUILTIN, OUTPUT);
  if (connected) {
    blinkEnabled = false;
    digitalWrite(LED_BUILTIN, LOW); // on (active LOW)
  } else {
    blinkEnabled = true;
  }
}

void startMDNS() {
  if (MDNS.begin(hostName)) {
    mdnsRunning = true;
    MDNS.addService("http", "tcp", 80);
    Serial.printf("mDNS: http://%s.local\n", hostName);
  } else {
    mdnsRunning = false;
    Serial.println("Failed to start mDNS");
  }
}

void startAP() {
  WiFi.mode(WIFI_AP);
  WiFi.softAP("Syra-Config");
  Serial.print("AP IP: ");
  Serial.println(WiFi.softAPIP());
  setLEDConnected(false);
  startMDNS();
}

// ---------- EEPROM device persistence ----------
void loadDevices() {
  int raw = EEPROM.read(DEV_LIST_ADDR);
  deviceCount = (raw >= 0 && raw <= DEV_MAX) ? raw : 0;
  for (int i = 0; i < deviceCount; i++) {
    int base = DEV_LIST_ADDR + 1 + i * DEV_NAME_LEN;
    String name;
    name.reserve(DEV_NAME_LEN);
    for (int j = 0; j < DEV_NAME_LEN - 1; j++) {
      char ch = EEPROM.read(base + j);
      if (ch == '\0') break;
      name += ch;
    }
    devices[i] = name;
  }
}

void saveDevices() {
  EEPROM.write(DEV_LIST_ADDR, deviceCount);
  for (int i = 0; i < DEV_MAX; i++) {
    int base = DEV_LIST_ADDR + 1 + i * DEV_NAME_LEN;
    for (int j = 0; j < DEV_NAME_LEN; j++) {
      EEPROM.write(base + j, 0);
    }
  }
  for (int i = 0; i < deviceCount; i++) {
    int base = DEV_LIST_ADDR + 1 + i * DEV_NAME_LEN;
    const String &name = devices[i];
    int j = 0;
    for (; j < (int)name.length() && j < DEV_NAME_LEN - 1; j++) {
      EEPROM.write(base + j, name[j]);
    }
    EEPROM.write(base + j, '\0');
  }
  EEPROM.commit();
}

bool addDevice(const String &raw) {
  String name = sanitizeName(raw);
  if (name.length() == 0) return false;
  for (int i = 0; i < deviceCount; i++) {
    if (devices[i] == name) return true; // already exists
  }
  if (deviceCount >= DEV_MAX) return false;
  devices[deviceCount++] = name;
  saveDevices();
  return true;
}

bool removeDeviceByName(const String &raw) {
  String name = sanitizeName(raw);
  if (name.length() == 0) return false;
  int idx = -1;
  for (int i = 0; i < deviceCount; i++) {
    if (devices[i] == name) { idx = i; break; }
  }
  if (idx < 0) return false;
  for (int i = idx; i < deviceCount - 1; i++) {
    devices[i] = devices[i + 1];
  }
  devices[deviceCount - 1] = "";
  deviceCount--;
  saveDevices();
  return true;
}

// ---------- Pages ----------
const char MAIN_page[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Syra Node</title>
<style>
body { font-family: Georgia, "Times New Roman", serif; background:#fff; color:#000; text-align:center; padding:48px 16px; }
button { background:#000; color:#fff; border:1px solid #000; padding:10px 18px; border-radius:8px; cursor:pointer; font-size:16px; margin:4px; }
button.btn-outline { background:#fff; color:#000; }
pre { text-align:left; margin:30px auto; max-width:520px; background:#f6f6f6; padding:16px; border-radius:8px; border:1px solid #ddd; overflow:auto; }
h1,h2{ font-weight:600; margin:0 0 16px; }
p{ margin:8px 0; }
small{ color:#444; }
a.ota-link { display:inline-block; margin-top:8px; color:#000; }
</style>
</head>
<body>
<h2>Syra Home</h2>
<p><small>mDNS domain:</small><br><b id="mdns">—</b></p>
<p><small>IP address:</small><br><b id="ip">—</b></p>
<p><small>Firmware:</small><br><b id="fw">—</b></p>
<div style="margin-top:12px;">
  <button onclick="testInfo()">Test /info</button>
  <button class="btn-outline" onclick="testAll()">Test all routes</button>
  <button class="btn-outline" onclick="disconnect()">Disconnect</button>
  <p style="margin-top:8px;"><small>Disconnecting activates the <b>Syra-Config</b> network for reconfiguration.</small></p>
  <a class="ota-link" href="/update">Firmware update (OTA)</a>
</div>
<div style="margin:24px auto; max-width:520px; text-align:left;">
  <h3 style="margin:0 0 8px;">Connected devices</h3>
  <ul id="devlist" style="padding-left:20px; margin:8px 0;"></ul>
  <p id="devhint" style="color:#444;">No devices registered yet.</p>
</div>
<pre id="out"></pre>

<script>
window.addEventListener('load', ()=>{ testInfo(); });
async function testInfo(){
  const out=document.getElementById('out');
  out.textContent="Querying /info...";
  try {
    const controller=new AbortController();
    const id=setTimeout(()=>controller.abort(),1500);
    const res=await fetch("/info",{signal:controller.signal});
    clearTimeout(id);
    const json=await res.json();
    out.textContent=JSON.stringify(json,null,2);
    document.getElementById('ip').textContent=json.ip||'—';
    document.getElementById('mdns').textContent=json.mdns||'—';
    document.getElementById('fw').textContent=json.fw||'—';
    loadDevices();
  }catch(e){
    out.textContent="Error: "+e;
  }
}
async function loadDevices(){
  try{
    const r = await fetch('/devices');
    if(!r.ok) return;
    const j = await r.json();
    const ul = document.getElementById('devlist');
    ul.innerHTML = '';
    if (j.items && j.items.length){
      document.getElementById('devhint').style.display='none';
      j.items.forEach(n=>{
        const li=document.createElement('li');
        li.textContent=n;
        ul.appendChild(li);
      })
    } else {
      document.getElementById('devhint').style.display='block';
    }
  }catch(e){/* ignore */}
}
async function disconnect(){
  const out=document.getElementById('out');
  out.textContent='Disconnecting and activating Syra-Config network...';
  try{
    const res=await fetch('/disconnect');
    if(res.ok){
      out.textContent='Syra-Config network activated. Connect to "Syra-Config" and go to http://Syra-Home-SYRA0156326.local or 192.168.4.1';
    } else {
      out.textContent='Failed to disconnect.';
    }
  }catch(e){
    out.textContent='Error: '+e;
  }
}
async function testAll(){
  const out = document.getElementById('out');
  out.textContent = "Testing all routes...\n";
  function log(msg){ out.textContent += msg + "\n"; }
  try{
    log("1) Testing /info...");
    const infoRes = await fetch("/info");
    log("   /info status: " + infoRes.status);
    const infoJson = await infoRes.json();
    log("   /info response: " + JSON.stringify(infoJson));

    log("2) Testing GET /devices...");
    const devGet = await fetch("/devices");
    log("   GET /devices status: " + devGet.status);
    const devGetJson = await devGet.json();
    log("   GET /devices response: " + JSON.stringify(devGetJson));

    log("3) Testing POST /devices (add TestDevice)...");
    const devPost = await fetch("/devices", {
      method: "POST",
      headers: {"Content-Type":"application/x-www-form-urlencoded"},
      body: "name=TestDevice"
    });
    log("   POST /devices status: " + devPost.status);
    log("   POST /devices response: " + await devPost.text());

    log("4) Testing DELETE /devices (remove TestDevice)...");
    const devDel = await fetch("/devices?name=TestDevice", { method: "DELETE" });
    log("   DELETE /devices status: " + devDel.status);
    log("   DELETE /devices response: " + await devDel.text());

    log("5) Testing POST /bridge...");
    const bridgePost = await fetch("/bridge", {
      method:"POST",
      headers: {"Content-Type":"application/x-www-form-urlencoded"},
      body:"to=DeviceA&from=Tester&data=Hello"
    });
    log("   POST /bridge status: " + bridgePost.status);
    log("   POST /bridge response: " + await bridgePost.text());

    log("6) Testing GET /bridge...");
    const bridgeGet = await fetch("/bridge?device=DeviceA");
    log("   GET /bridge status: " + bridgeGet.status);
    log("   GET /bridge response: " + await bridgeGet.text());

    log("7) Testing /disconnect (NOT recommended in production, switches to AP)...");
    try{
      const disRes = await fetch("/disconnect");
      log("   /disconnect status: " + disRes.status);
      log("   /disconnect response: " + await disRes.text());
    }catch(e){
      log("   Error testing /disconnect: "+e);
    }

    log("\n✅ Tests complete. Check the status of each route above.");
  }catch(e){
    log("❌ Test error: " + e);
  }
  loadDevices();
}
</script>
</body>
</html>
)rawliteral";

const char CONFIG_page[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Syra Config</title>
<style>
body { font-family: Georgia, "Times New Roman", serif; background:#fff; color:#000; text-align:center; padding:48px 16px; }
input { margin:8px; padding:10px 12px; border:1px solid #000; border-radius:8px; width:260px; }
button { background:#000; color:#fff; border:1px solid #000; padding:10px 18px; border-radius:8px; cursor:pointer; font-size:16px; margin-top:8px; }
h2 { font-weight:600; }
small{ color:#444; }
</style>
</head>
<body>
<h2>Configure Wi-Fi — Syra Home</h2>
<p><small>mDNS domain: <b>Syra-Home-SYRA0156326.local</b></small></p>
<form action="/setwifi" method="post">
  <input name="ssid" placeholder="SSID" required><br>
  <input name="pass" type="password" placeholder="Password"><br>
  <button type="submit">Connect</button>
</form>
</body>
</html>
)rawliteral";

// ---------- Handlers ----------
void handleRoot() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send_P(200, "text/html", MAIN_page);
}

void handleConfig() {
  server.send_P(200, "text/html", CONFIG_page);
}

void handleRootDynamic() {
  if (WiFi.status() == WL_CONNECTED && WiFi.getMode() == WIFI_STA) {
    handleRoot();
  } else {
    handleConfig();
  }
}

void handleInfo() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String ip = (WiFi.getMode() == WIFI_AP) ? WiFi.softAPIP().toString() : WiFi.localIP().toString();
  String status = (WiFi.status() == WL_CONNECTED) ? "online" : "config";
  String json;
  json.reserve(220);
  json += "{\"id\":\"";      json += serialNumber;
  json += "\",\"name\":\"Syra Node\",\"ip\":\""; json += ip;
  json += "\",\"status\":\""; json += status;
  json += "\",\"mdns\":\"";  json += hostName; json += ".local";
  json += "\",\"fw\":\"";    json += __DATE__; json += " "; json += __TIME__;
  json += "\"}";
  server.send(200, "application/json", json);
}

void handleDevicesGet() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String json;
  json.reserve(64 + deviceCount * (DEV_NAME_LEN + 3));
  json += "{\"count\":"; json += deviceCount; json += ",\"items\":[";
  for (int i = 0; i < deviceCount; i++) {
    if (i) json += ",";
    json += "\""; json += devices[i]; json += "\"";
  }
  json += "]}";
  server.send(200, "application/json", json);
}

String getArgAny(const String &key) {
  if (server.hasArg(key)) return server.arg(key);
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    int pos = body.indexOf(key);
    if (pos >= 0) {
      int q1 = body.indexOf('"', pos + key.length());
      if (q1 >= 0) {
        int q2 = body.indexOf('"', q1 + 1);
        if (q2 > q1) return body.substring(q1 + 1, q2);
      }
    }
  }
  return "";
}

void handleDevicesPost() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String name = getArgAny("name");
  if (name.length() == 0) {
    server.send(400, "application/json", "{\"ok\":false,\"err\":\"name required\"}");
    return;
  }
  bool ok = addDevice(name);
  if (ok) server.send(200, "application/json", "{\"ok\":true}");
  else server.send(409, "application/json", "{\"ok\":false,\"err\":\"list full or duplicate\"}");
}

void handleDevicesDelete() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String name = getArgAny("name");
  if (name.length() == 0) {
    server.send(400, "application/json", "{\"ok\":false,\"err\":\"name required\"}");
    return;
  }
  bool ok = removeDeviceByName(name);
  if (ok) server.send(200, "application/json", "{\"ok\":true}");
  else server.send(404, "application/json", "{\"ok\":false,\"err\":\"device not found\"}");
}

int findFreeMsg() { for (int i = 0; i < MSG_MAX; i++) if (!msgs[i].used) return i; return -1; }
int findOldestMsg() {
  int idx = -1;
  unsigned long oldest = ULONG_MAX;
  for (int i = 0; i < MSG_MAX; i++) {
    if (msgs[i].used && msgs[i].ts < oldest) { oldest = msgs[i].ts; idx = i; }
  }
  return idx;
}

void handleBridgePost() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String to = sanitizeName(getArgAny("to"));
  String from = sanitizeName(getArgAny("from"));
  String body = getArgAny("data");
  if (body.length() == 0) body = getArgAny("body");
  if (to.length() == 0 || from.length() == 0 || body.length() == 0) {
    server.send(400, "application/json", "{\"ok\":false,\"err\":\"required params: to, from, data\"}");
    return;
  }
  if (body.length() > 256) body = body.substring(0, 256);
  int idx = findFreeMsg();
  if (idx < 0) idx = findOldestMsg();
  if (idx < 0) {
    server.send(507, "application/json", "{\"ok\":false,\"err\":\"mailbox full\"}");
    return;
  }
  msgs[idx].to = to; msgs[idx].from = from; msgs[idx].body = body;
  msgs[idx].ts = millis(); msgs[idx].used = true;
  server.send(200, "application/json", "{\"ok\":true}");
}

void handleBridgeGet() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String who = sanitizeName(server.hasArg("device") ? server.arg("device") : server.arg("to"));
  if (who.length() == 0) {
    server.send(400, "application/json", "{\"ok\":false,\"err\":\"device required\"}");
    return;
  }
  String json;
  json.reserve(512);
  json += "{\"ok\":true,\"messages\":[";
  bool first = true;
  unsigned long now = millis();
  for (int i = 0; i < MSG_MAX; i++) {
    if (msgs[i].used && msgs[i].to == who) {
      if (!first) json += ","; else first = false;
      json += "{\"from\":\""; json += msgs[i].from;
      json += "\",\"data\":\""; json += msgs[i].body;
      json += "\",\"ts\":"; json += msgs[i].ts; json += "}";
      msgs[i].used = false; // consumed
      msgs[i].to = msgs[i].from = msgs[i].body = "";
      msgs[i].ts = now;
    }
  }
  json += "]}";
  server.send(200, "application/json", json);
}

void writeStringToEEPROM(int addr, const String &data) {
  size_t i = 0;
  for (; i < data.length(); ++i) EEPROM.write(addr + i, data[i]);
  EEPROM.write(addr + i, '\0');
}

String readStringFromEEPROM(int addr) {
  String data;
  data.reserve(32);
  char ch = EEPROM.read(addr);
  int i = 0;
  while (ch != '\0' && i < 31) {
    data += ch;
    i++;
    ch = EEPROM.read(addr + i);
  }
  return data;
}

void handleDisconnect() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "Disconnecting and starting Syra-Config...");
  WiFi.disconnect(true);
  delay(300);
  startAP();
}

void handleSetWiFi() {
  String ssid = server.arg("ssid");
  String pass = server.arg("pass");
  writeStringToEEPROM(SSID_ADDR, ssid);
  writeStringToEEPROM(PASS_ADDR, pass);
  EEPROM.commit();
  server.send(200, "text/html",
    "<h2>Connecting...</h2><p>If the connection succeeds, the device will restart.</p>"
    "<script>setTimeout(() => location.reload(), 10000);</script>");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), pass.c_str());

  // Non-blocking-ish wait with watchdog feed
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
    delay(100);
    yield();
  }
  if (WiFi.status() == WL_CONNECTED) {
    startMDNS();
    ESP.restart();
  }
}

void handleNotFound() {
  server.send(404, "application/json", "{\"ok\":false,\"err\":\"not found\"}");
}

// ---------- Setup / Loop ----------
void setup() {
  Serial.begin(115200);
  EEPROM.begin(EEPROM_SIZE);
  loadDevices();
  pinMode(LED_BUILTIN, OUTPUT);

  String savedSSID = readStringFromEEPROM(SSID_ADDR);
  String savedPass = readStringFromEEPROM(PASS_ADDR);
  bool connected = false;

  if (savedSSID.length() > 0) {
    Serial.println("Trying to connect with saved credentials...");
    WiFi.mode(WIFI_STA);
    WiFi.setSleepMode(WIFI_NONE_SLEEP); // faster, more stable HTTP/OTA response
    WiFi.begin(savedSSID.c_str(), savedPass.c_str());
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      Serial.print(".");
      attempts++;
    }
    if (WiFi.status() == WL_CONNECTED) {
      connected = true;
      Serial.println("\n✅ Connected with saved credentials!");
      Serial.print("Local IP: ");
      Serial.println(WiFi.localIP());
      setLEDConnected(true);
      lastConnOk = millis();
    }
  }

  if (!connected) {
    Serial.println("Starting AP mode for configuration...");
    startAP();
  }

  server.on("/", handleRootDynamic);
  server.on("/setwifi", HTTP_POST, handleSetWiFi);
  server.on("/info", handleInfo);
  server.on("/disconnect", handleDisconnect);
  server.on("/devices", HTTP_GET, handleDevicesGet);
  server.on("/devices", HTTP_POST, handleDevicesPost);
  server.on("/devices", HTTP_DELETE, handleDevicesDelete);
  server.on("/bridge", HTTP_GET, handleBridgeGet);
  server.on("/bridge", HTTP_POST, handleBridgePost);
  server.onNotFound(handleNotFound);

  // OTA update endpoint: http://<ip-or-mdns>/update (browser upload of .bin)
  httpUpdater.setup(&server, "/update", OTA_USER, OTA_PASS);

  server.begin();
  Serial.println("HTTP server started!");
  Serial.println("OTA available at /update (Basic Auth protected)");

  if (connected) {
    startMDNS();
  }
}

void loop() {
  server.handleClient();
  if (mdnsRunning) {
    MDNS.update();
  }

  // Connection monitor
  if (WiFi.getMode() == WIFI_STA) {
    if (WiFi.status() == WL_CONNECTED) {
      if (!blinkEnabled) digitalWrite(LED_BUILTIN, LOW); // ensure LED is on
      lastConnOk = millis();
    } else if (millis() - lastConnOk > 10000) { // 10s without connection => back to AP
      Serial.println("Connection lost. Returning to Syra-Config...");
      startAP();
    }
  }

  // Blink LED in AP/config mode
  if (blinkEnabled && millis() - lastBlink >= BLINK_INTERVAL) {
    lastBlink = millis();
    digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
  }
}
