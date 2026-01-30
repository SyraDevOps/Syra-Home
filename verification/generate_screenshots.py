from playwright.sync_api import sync_playwright
import time

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()

        # 1. Base Mesh View
        page.goto("http://localhost:8080/index.html")

        # Wait for initialization
        time.sleep(2)

        # Handle Memory Modal if present
        try:
            page.wait_for_selector(".memory-btn-secondary", timeout=2000)
            page.click(".memory-btn-secondary")
            time.sleep(1)
        except:
            pass

        # Ensure mesh container is active/visible
        page.evaluate("document.querySelector('.mesh-container').classList.add('active')")
        page.screenshot(path="docs/screenshots/screenshot_mesh.png")
        print("Captured Mesh")

        # 2. Plan Mode
        page.type("#hidden-input", "/plan")
        page.press("#hidden-input", "Enter")
        time.sleep(2)
        page.screenshot(path="docs/screenshots/screenshot_plan.png")
        print("Captured Plan Mode")

        # Exit Plan Mode
        page.keyboard.press("Escape")
        time.sleep(1)

        # 3. Settings Modal
        page.evaluate("openSettings()")
        time.sleep(1)
        page.screenshot(path="docs/screenshots/screenshot_settings.png")
        print("Captured Settings")

        # Close Settings
        page.evaluate("closeSettings()")
        time.sleep(1)

        # 4. Vox Interface (Simulated)
        page.evaluate("startVoxMode()")
        time.sleep(2)
        page.screenshot(path="docs/screenshots/screenshot_vox.png")
        print("Captured Vox")

        browser.close()

if __name__ == "__main__":
    run()
