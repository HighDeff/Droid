#!/usr/bin/env python
import json
import sys
import time
import re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))

from automation import (
    click_mouse,
    double_click,
    move_mouse,
    type_text,
    press_key,
    hotkey,
    scroll,
    clear_and_type_at,
    focus_and_click,
    get_adb_devices,
    execute_adb_tap,
    execute_adb_swipe,
    execute_adb_text,
    execute_adb_keyevent,
    capture_screen_primary,
    move_mouse_human,
    click_mouse_human,
    type_text_human,
    stream_mouse_route,
    activate_and_focus_window,
    execute_relative_action,
)

def main():
    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({"success": False, "error": "No input payload provided"}))
            return

        payload = json.loads(raw_input)
        # Support both wrapped {task:{...}} and unwrapped {id, name, description, action, ...} and dual-AI {id,name,description,status,...}
        task = payload.get("task", None)
        if task is None or not isinstance(task, dict) or len(task) == 0:
            # If payload itself looks like a task (has id/name/description) treat payload as task
            if any(k in payload for k in ("id", "name", "description", "action", "targetPosition", "x", "y")):
                task = payload
            else:
                task = {}
        target_device = payload.get("targetDevice", task.get("targetDevice", "desktop"))
        device_id = payload.get("deviceId", task.get("deviceId", None))
        aggressive_retry = payload.get("aggressiveRetry", True)

        # Normalize action from multiple possible fields: action, actionType, description inference
        raw_action = task.get("action", task.get("actionType", payload.get("action", payload.get("actionType", ""))))
        action = str(raw_action).lower().strip()
        # Infer from description if still empty (e.g., "Right click at ...", "Wait for 500ms")
        if not action:
            desc = str(task.get("description", "")).lower()
            if "right click" in desc:
                action = "right_click"
            elif "double click" in desc or "double_click" in desc:
                action = "double_click"
            elif "clear and type" in desc:
                action = "clear_and_type"
            elif desc.startswith("type"):
                action = "type_text"
            elif "hotkey" in desc:
                action = "hotkey"
            elif "press key" in desc:
                action = "press_key"
            elif "scroll" in desc:
                action = "scroll"
            elif "wait" in desc:
                action = "wait"
            else:
                action = "click"
        target_pos = task.get("targetPosition", {})
        x = int(target_pos.get("x", task.get("x", payload.get("x", 960))))
        y = int(target_pos.get("y", task.get("y", payload.get("y", 540))))
        text_payload = task.get("textPayload", task.get("text", payload.get("text", "")))
        key_payload = task.get("keyPayload", task.get("key", payload.get("key", "enter")))
        # fallback: if text_payload empty but description contains quoted string, extract
        if not text_payload and action in ("clear_and_type", "type_text", "type"):
            m = re.search(r'"([^"]+)"', str(task.get("description", "")))
            if m:
                text_payload = m.group(1)
        explanation = ""

        # Android Device Execution
        if target_device == "android":
            if action in ["click", "tap"]:
                execute_adb_tap(x, y, device_id)
                explanation = f"Tapped Android screen at ({x}, {y}) via ADB."
            elif action in ["double_click", "double_tap"]:
                execute_adb_tap(x, y, device_id)
                time.sleep(0.1)
                execute_adb_tap(x, y, device_id)
                explanation = f"Double-tapped Android screen at ({x}, {y}) via ADB."
            elif action in ["swipe", "drag"]:
                drag_end = task.get("dragEndPosition", {})
                x2 = int(drag_end.get("x", x))
                y2 = int(drag_end.get("y", y - 300))
                execute_adb_swipe(x, y, x2, y2, 400, device_id)
                explanation = f"Swiped on Android from ({x}, {y}) to ({x2}, {y2}) via ADB."
            elif action in ["type", "clear_and_type", "type_text"]:
                execute_adb_tap(x, y, device_id)
                time.sleep(0.3)
                execute_adb_text(text_payload, device_id)
                explanation = f"Focused ({x}, {y}) and typed \"{text_payload}\" on Android via ADB."
            elif action in ["key", "press_key", "hotkey"]:
                keycode_map = {"enter": 66, "back": 4, "home": 3, "tab": 61, "escape": 111}
                code = keycode_map.get(key_payload.lower(), 66)
                execute_adb_keyevent(code, device_id)
                explanation = f"Sent keyevent {code} ({key_payload}) on Android via ADB."
            else:
                execute_adb_tap(x, y, device_id)
                explanation = f"Executed generic touch action at ({x}, {y}) on Android via ADB."

            print(json.dumps({
                "success": True,
                "targetDevice": "android",
                "action": action,
                "coordinates": {"x": x, "y": y},
                "explanation": explanation,
                "improved": True,
            }))
            return

        # Handle wait action immediately (no physical movement needed)
        if action in ["wait", "sleep"]:
            delay_ms = task.get("delayMs", task.get("delay", 500))
            try:
                delay_ms = int(delay_ms)
            except:
                delay_ms = 500
            time.sleep(max(0, delay_ms) / 1000.0)
            print(json.dumps({
                "success": True,
                "targetDevice": "desktop",
                "action": "wait",
                "coordinates": {"x": x, "y": y},
                "explanation": f"Waited for {delay_ms}ms.",
                "improved": True,
            }))
            return

        # Desktop (Windows/PyAutoGUI) Native OS Execution
        if action in ["stream_mouse_route", "play_route", "replay_route"]:
            route_points = task.get("routePoints", task.get("points", []))
            speed_mult = float(task.get("speedMultiplier", 1.0))
            drift = int(task.get("driftPx", 4))
            is_drag_mode = bool(task.get("isDrag", False))
            stream_mouse_route(route_points, speed_multiplier=speed_mult, drift_px=drift, is_drag=is_drag_mode)
            explanation = f"Streamed continuous 60Hz mouse route ({len(route_points)} waypoints) across OS desktop."
        elif action in ["activate_window", "focus_window"]:
            act_x = int(target_pos.get("x", 960))
            act_y = int(target_pos.get("y", 200))
            dwell = int(task.get("dwellMs", 150))
            activate_and_focus_window(act_x, act_y, dwell)
            explanation = f"Special window activation click dispatched at ({act_x}, {act_y}) with {dwell}ms focus lock."
        elif action in ["relative_action", "relative_click", "relative_type"]:
            origin = task.get("appOrigin", {"x": 100, "y": 100})
            rel_u = int(task.get("relU", target_pos.get("x", 0)))
            rel_v = int(task.get("relV", target_pos.get("y", 0)))
            sub_act = task.get("subAction", "click")
            res_data = execute_relative_action(origin.get("x", 0), origin.get("y", 0), rel_u, rel_v, sub_act, text_payload)
            explanation = f"Executed relative {sub_act} at ({rel_u}, {rel_v}) -> Absolute ({res_data['absoluteCoords']['x']}, {res_data['absoluteCoords']['y']})."
        # driftPx controlled by movementMode: exact=0, variation=6, live=8
        driftPx = int(task.get("driftPx", task.get("drift", 6)))
        variationMode = task.get("variationMode", task.get("movementMode", "variation"))

        if action in ["click", "focus_and_click"]:
            click_mouse_human(x, y, dwell_ms=120, drift_px=driftPx)
            explanation = f"Moved mouse via cubic spline and clicked at ({x}, {y}) on Desktop (drift {driftPx}px, mode {variationMode})."
        elif action in ["double_click"]:
            if variationMode == "exact" or driftPx == 0:
                double_click(x, y)
            else:
                move_mouse_human(x, y, drift_px=driftPx)
                import pyautogui as _pg2
                _pg2.doubleClick(x, y)
            explanation = f"Double clicked at ({x}, {y}) on Desktop (drift {driftPx}px)."
        elif action in ["right_click"]:
            import pyautogui as _pg
            # Exact mode = no drift, move humanized then rightClick
            if driftPx == 0:
                _pg.moveTo(x, y, duration=0.15)
                _pg.rightClick(x, y)
            else:
                move_mouse_human(x, y, drift_px=driftPx)
                _pg.rightClick(x, y)
            explanation = f"Right clicked at ({x}, {y}) on Desktop (drift {driftPx}px, mode {variationMode})."
        elif action in ["type", "type_text"]:
            click_mouse_human(x, y, dwell_ms=120, drift_px=6)
            time.sleep(0.2)
            type_text_human(text_payload, base_delay_ms=65, jitter_ms=35)
            explanation = f"Focused ({x}, {y}) and typed payload \"{text_payload}\"."
        elif action in ["clear_and_type"]:
            clear_and_type_at(x, y, text_payload)
            explanation = f"Cleared existing content and typed \"{text_payload}\" at ({x}, {y})."
        elif action in ["drag", "drag_and_drop"]:
            import pyautogui
            drag_end = task.get("dragEndPosition", {})
            x2 = int(drag_end.get("x", x + 200))
            y2 = int(drag_end.get("y", y))
            pyautogui.moveTo(x, y, duration=0.3)
            pyautogui.dragTo(x2, y2, duration=0.6, button='left')
            explanation = f"Dragged from ({x}, {y}) to ({x2}, {y2}) on Desktop."
        elif action in ["key", "press_key"]:
            press_key(key_payload)
            explanation = f"Pressed key \"{key_payload}\" on Desktop."
        elif action in ["hotkey"]:
            keys = text_payload.split("+") if text_payload else [key_payload]
            hotkey(*keys)
            explanation = f"Dispatched hotkey \"{'+'.join(keys)}\" on Desktop."
        elif action in ["scroll"]:
            scroll(-5 if "down" in text_payload.lower() else 5)
            explanation = f"Scrolled viewport on Desktop."
        else:
            click_mouse_human(x, y, dwell_ms=120, drift_px=6)
            explanation = f"Executed default click action at ({x}, {y})."

        print(json.dumps({
            "success": True,
            "targetDevice": "desktop",
            "action": action,
            "coordinates": {"x": x, "y": y},
            "explanation": explanation,
            "improved": True,
        }))

    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
