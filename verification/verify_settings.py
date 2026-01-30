from playwright.sync_api import sync_playwright
import os

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        page.on("console", lambda msg: print(f"PAGE LOG: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        page.goto("http://localhost:8080/index.html")

        # Handle Memory Modal
        try:
            page.wait_for_selector(".memory-btn-secondary", timeout=2000)
            page.click(".memory-btn-secondary")
            page.wait_for_selector("#memory-modal-overlay", state="hidden")
        except:
            print("Memory modal not found or already closed")

        # Wait for settings button
        page.wait_for_selector("#settings-btn")

        # Click
        print("Clicking settings button...")
        page.click("#settings-btn")

        # Wait for modal
        print("Waiting for modal...")
        page.wait_for_selector("#settings-modal:not(.hidden)", timeout=5000)

        page.screenshot(path="verification/settings_modal.png")
        browser.close()

if __name__ == "__main__":
    run()
