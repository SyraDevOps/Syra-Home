#include <ESP8266WiFi.h>
#include <ESP8266WebServer.h>
#include <ESP8266mDNS.h>
#include <EEPROM.h>

const char* hostName = "Syra-Home-SYRA0156326";  // acesse http://Syra-Home-SYRA0156326.local
const char* serialNumber = "SYRA0156326";
const int EEPROM_SIZE = 512;
const int SSID_ADDR = 0;
const int PASS_ADDR = 32;

ESP8266WebServer server(80);
bool mdnsRunning = false;

// LED e conexão
unsigned long lastBlink = 0;
const unsigned long BLINK_INTERVAL = 2000; // pisca a cada 2s
bool blinkEnabled = false;
unsigned long lastConnOk = 0;

// Persistência simples de dispositivos
const int DEV_LIST_ADDR = 64;
const int DEV_MAX = 10;
const int DEV_NAME_LEN = 32; // bytes por nome (inclui terminador)
int deviceCount = 0;
String devices[DEV_MAX];

// Mensageria (Bridge) na RAM
const int MSG_MAX = 20;
struct Msg { String to; String from; String body; unsigned long ts; bool used; };
Msg msgs[MSG_MAX];

// Utilidades
String sanitizeName(String s) {
  String out = "";
  for (size_t i = 0; i < s.length(); i++) {
    char c = s[i];
    if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z') || (c >= '0' && c <= '9') || c==' ' || c=='-' || c=='_') {
      out += c;
    }
    if (out.length() >= DEV_NAME_LEN - 1) break;
  }
  out.trim();
  return out;
}

void setLEDConnected(bool connected) {
  pinMode(LED_BUILTIN, OUTPUT);
  if (connected) {
    blinkEnabled = false;
    digitalWrite(LED_BUILTIN, LOW); // ligado (ativo em LOW)
  } else {
    blinkEnabled = true;
  }
}

void startMDNS() {
  if (MDNS.begin(hostName)) {
    mdnsRunning = true;
    Serial.printf("mDNS: http://%s.local\n", hostName);
  } else {
    mdnsRunning = false;
    Serial.println("Falha ao iniciar mDNS");
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

// Persistência dos dispositivos no EEPROM
void loadDevices() {
  deviceCount = EEPROM.read(DEV_LIST_ADDR);
  if (deviceCount < 0 || deviceCount > DEV_MAX) deviceCount = 0;
  for (int i = 0; i < deviceCount; i++) {
    int base = DEV_LIST_ADDR + 1 + i * DEV_NAME_LEN;
    String name = "";
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
    for (; j < name.length() && j < DEV_NAME_LEN - 1; j++) {
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
    if (devices[i] == name) return true; // já existe
  }
  if (deviceCount >= DEV_MAX) return false;
  devices[deviceCount++] = name;
  saveDevices();
  return true;
}

// Página principal HTML (mostra IP, domínio e botões)
const char MAIN_page[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="pt-BR">
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
</style>
</head>
<body>
<h2>Syra Home</h2>
<p><small>Domínio mDNS:</small><br><b id="mdns">—</b></p>
<p><small>Endereço IP:</small><br><b id="ip">—</b></p>
<div style="margin-top:12px;">
  <button onclick="testInfo()">Testar /info</button>
  <button class="btn-outline" onclick="disconnect()">Desconectar</button>
  <p style="margin-top:8px;"><small>Desconectar ativa a rede <b>Syra-Config</b> para reconfiguração.</small></p>
</div>
<div style="margin:24px auto; max-width:520px; text-align:left;">
  <h3 style="margin:0 0 8px;">Dispositivos conectados</h3>
  <ul id="devlist" style="padding-left:20px; margin:8px 0;"></ul>
  <p id="devhint" style="color:#444;">Nenhum dispositivo registrado ainda.</p>
</div>
<pre id="out"></pre>

<script>
window.addEventListener('load', ()=>{ testInfo(); });
async function testInfo(){
  const out=document.getElementById('out');
  out.textContent="Consultando /info...";
  try {
    const controller=new AbortController();
    const id=setTimeout(()=>controller.abort(),1500);
    const res=await fetch("/info",{signal:controller.signal});
    clearTimeout(id);
    const json=await res.json();
    out.textContent=JSON.stringify(json,null,2);
    document.getElementById('ip').textContent=json.ip||'—';
    document.getElementById('mdns').textContent=json.mdns||'—';
    loadDevices();
  }catch(e){
    out.textContent="Erro: "+e;
  }
}
async function loadDevices(){
  try{
    const r = await fetch('/dispositivos');
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
  out.textContent='Desconectando e ativando rede Syra-Config...';
  try{
    const res=await fetch('/disconnect');
    if(res.ok){
      out.textContent='Rede Syra-Config ativada. Conecte-se a "Syra-Config" e acesse http://Syra-Home-SYRA0156326.local ou 192.168.4.1';
    } else {
      out.textContent='Falha ao desconectar.';
    }
  }catch(e){
    out.textContent='Erro: '+e;
  }
}
</script>
</body>
</html>
)rawliteral";

const char CONFIG_page[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html lang="pt-BR">
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
<h2>Configurar Wi‑Fi — Syra Home</h2>
<p><small>Domínio mDNS: <b>Syra-Home-SYRA0156326.local</b></small></p>
<form action="/setwifi" method="post">
  <input name="ssid" placeholder="SSID" required><br>
  <input name="pass" type="password" placeholder="Password"><br>
  <button type="submit">Conectar</button>
</form>
</body>
</html>
)rawliteral";

void handleRoot() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/html", MAIN_page);
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
  String json = "{"
                "\"id\":\"" + String(serialNumber) + "\","
                "\"name\":\"Syra Node\","
                "\"ip\":\"" + ip + "\"," 
                "\"status\":\"" + status + "\"," 
                "\"mdns\":\"" + String(hostName) + ".local\"" 
                "}";
  server.send(200, "application/json", json);
}

void handleDevicesGet() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String json = "{\"count\":" + String(deviceCount) + ",\"items\":[";
  for (int i = 0; i < deviceCount; i++) {
    if (i) json += ",";
    json += "\"" + devices[i] + "\"";
  }
  json += "]}";
  server.send(200, "application/json", json);
}

String getArgAny(const String &key){
  if (server.hasArg(key)) return server.arg(key);
  if (server.hasArg("plain")) {
    String body = server.arg("plain");
    int pos = body.indexOf(key);
    if (pos >= 0) {
      int q1 = body.indexOf('"', pos + key.length());
      if (q1 >= 0) {
        int q2 = body.indexOf('"', q1+1);
        if (q2 > q1) return body.substring(q1+1, q2);
      }
    }
  }
  return "";
}

void handleDevicesPost() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String name = getArgAny("name");
  if (name.length()==0) { server.send(400, "application/json", "{\"ok\":false,\"err\":\"name requerido\"}"); return; }
  bool ok = addDevice(name);
  if (ok) server.send(200, "application/json", "{\"ok\":true}");
  else server.send(409, "application/json", "{\"ok\":false,\"err\":\"lista cheia ou duplicado\"}");
}

int findFreeMsg(){ for (int i=0;i<MSG_MAX;i++) if (!msgs[i].used) return i; return -1; }
int findOldestMsg(){ int idx=-1; unsigned long oldest=UINT32_MAX; for(int i=0;i<MSG_MAX;i++){ if(msgs[i].used && msgs[i].ts<oldest){oldest=msgs[i].ts; idx=i;} } return idx; }

void handleBridgePost(){
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String to = sanitizeName(getArgAny("to"));
  String from = sanitizeName(getArgAny("from"));
  String body = getArgAny("data");
  if (body.length()==0) body = getArgAny("body");
  if (to.length()==0 || from.length()==0 || body.length()==0){ server.send(400, "application/json", "{\"ok\":false,\"err\":\"parâmetros requeridos: to, from, data\"}"); return; }
  if (body.length() > 256) body = body.substring(0,256);
  int idx = findFreeMsg();
  if (idx<0) idx = findOldestMsg();
  if (idx<0){ server.send(507, "application/json", "{\"ok\":false,\"err\":\"caixa cheia\"}"); return; }
  msgs[idx].to = to; msgs[idx].from = from; msgs[idx].body = body; msgs[idx].ts = millis(); msgs[idx].used = true;
  server.send(200, "application/json", "{\"ok\":true}");
}

void handleBridgeGet(){
  server.sendHeader("Access-Control-Allow-Origin", "*");
  String who = sanitizeName(server.hasArg("device") ? server.arg("device") : server.arg("to"));
  if (who.length()==0){ server.send(400, "application/json", "{\"ok\":false,\"err\":\"device requerido\"}"); return; }
  String json = "{\"ok\":true,\"messages\":[";
  bool first=true;
  unsigned long now = millis();
  for (int i=0;i<MSG_MAX;i++){
    if (msgs[i].used && msgs[i].to == who){
      if (!first) json += ","; else first=false;
      json += "{\"from\":\"" + msgs[i].from + "\",\"data\":\"" + msgs[i].body + "\",\"ts\":" + String(msgs[i].ts) + "}";
      msgs[i].used = false; // consumiu
      msgs[i].to = msgs[i].from = msgs[i].body = "";
      msgs[i].ts = now;
    }
  }
  json += "]}";
  server.send(200, "application/json", json);
}

void writeStringToEEPROM(int addr, String data) {
  for (int i = 0; i < data.length(); ++i) {
    EEPROM.write(addr + i, data[i]);
  }
  EEPROM.write(addr + data.length(), '\0');
}

String readStringFromEEPROM(int addr) {
  String data = "";
  char ch = EEPROM.read(addr);
  int i = 0;
  while (ch != '\0' && i < 31) {
    data += ch;
    i++;
    ch = EEPROM.read(addr + i);
  }
  return data;
}

void handleConfig() {
  server.send(200, "text/html", CONFIG_page);
}

void handleDisconnect() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.send(200, "text/plain", "Desconectando e iniciando Syra-Config...");
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
  server.send(200, "text/html", "<h2>Conectando...</h2><p>Se conectar, o dispositivo será reiniciado.</p><script>setTimeout(() => location.reload(), 10000);</script>");
  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid.c_str(), pass.c_str());
  delay(5000);
  if (WiFi.status() == WL_CONNECTED) {
    startMDNS();
    ESP.restart();
  }
}

void setup() {
  Serial.begin(115200);
  EEPROM.begin(EEPROM_SIZE);
  loadDevices();
  pinMode(LED_BUILTIN, OUTPUT);
  String savedSSID = readStringFromEEPROM(SSID_ADDR);
  String savedPass = readStringFromEEPROM(PASS_ADDR);
  bool connected = false;
  if (savedSSID.length() > 0) {
    Serial.println("Tentando conectar com credenciais salvas...");
    WiFi.mode(WIFI_STA);
    WiFi.begin(savedSSID.c_str(), savedPass.c_str());
    int attempts = 0;
    while (WiFi.status() != WL_CONNECTED && attempts < 20) {
      delay(500);
      Serial.print(".");
      attempts++;
    }
    if (WiFi.status() == WL_CONNECTED) {
      connected = true;
      Serial.println("\n✅ Conectado com credenciais salvas!");
      Serial.print("IP local: ");
      Serial.println(WiFi.localIP());
      setLEDConnected(true);
      lastConnOk = millis();
    }
  }
  if (!connected) {
    Serial.println("Iniciando modo AP para configuração...");
    startAP();
  }
  server.on("/", handleRootDynamic);
  server.on("/setwifi", HTTP_POST, handleSetWiFi);
  server.on("/info", handleInfo);
  server.on("/disconnect", handleDisconnect);
  server.on("/dispositivos", HTTP_GET, handleDevicesGet);
  server.on("/dispositivos", HTTP_POST, handleDevicesPost);
  server.on("/bridge", HTTP_GET, handleBridgeGet);
  server.on("/bridge", HTTP_POST, handleBridgePost);
  server.begin();
  Serial.println("Servidor HTTP iniciado!");
  if (connected) {
    startMDNS();
  }
}

void loop() {
  server.handleClient();
  if (mdnsRunning) {
    MDNS.update();
  }
  // Monitor da conexão
  if (WiFi.getMode() == WIFI_STA) {
    if (WiFi.status() == WL_CONNECTED) {
      if (!blinkEnabled) digitalWrite(LED_BUILTIN, LOW); // garante LED ligado
      lastConnOk = millis();
    } else {
      if (millis() - lastConnOk > 10000) { // 10s sem conexão => volta ao AP
        Serial.println("Conexão perdida. Voltando ao Syra-Config...");
        startAP();
      }
    }
  }
  // Pisca LED no modo AP/config
  if (blinkEnabled) {
    if (millis() - lastBlink >= BLINK_INTERVAL) {
      lastBlink = millis();
      int current = digitalRead(LED_BUILTIN);
      digitalWrite(LED_BUILTIN, !current);
    }
  }
}
