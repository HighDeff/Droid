#!/usr/bin/env python
"""
Entity Detection Module
Analyzes screenshots to detect game entities (player, enemies, objectives, etc.)
Uses color detection, edge detection, and pattern matching
"""

import json
import sys
import numpy as np
from pathlib import Path

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False


class EntityDetector:
    def __init__(self):
        self.color_ranges = {
            "red": ((0, 50, 50), (10, 255, 255)),  # HSV
            "green": ((35, 50, 50), (85, 255, 255)),
            "blue": ((100, 50, 50), (130, 255, 255)),
            "yellow": ((20, 50, 50), (30, 255, 255)),
            "skin": ((0, 20, 70), (20, 255, 255)),
        }

    def detect_entities(self, image_data_base64: str) -> dict:
        """
        Detect entities in the image
        Returns: Dict with detected entities, game phase, patterns
        """
        try:
            # Decode image
            import base64

            if "," in image_data_base64:
                image_data_base64 = image_data_base64.split(",")[1]

            image_bytes = base64.b64decode(image_data_base64)

            # Load image
            if PIL_AVAILABLE:
                img = Image.open(Path("/tmp/temp_screenshot.png"))
                # Save temporarily
                with open("/tmp/temp_screenshot.png", "wb") as f:
                    f.write(image_bytes)
                img = Image.open(Path("/tmp/temp_screenshot.png"))
            else:
                raise ImportError("PIL required for entity detection")

            # Convert to numpy array
            img_array = np.array(img)

            # Detect entities
            entities = []

            # Detect player (usually center, skin-colored or specific color)
            player = self.detect_player(img_array)
            if player:
                entities.append(player)

            # Detect enemies (red/dark colored, hostile appearance)
            enemies = self.detect_enemies(img_array)
            entities.extend(enemies)

            # Detect objectives (yellow/bright colored, high priority)
            objectives = self.detect_objectives(img_array)
            entities.extend(objectives)

            # Detect items (small, bright colored)
            items = self.detect_items(img_array)
            entities.extend(items)

            # Detect NPCs (distinct color, non-hostile)
            npcs = self.detect_npcs(img_array)
            entities.extend(npcs)

            # Detect game phase
            game_phase = self.detect_game_phase(img_array)

            # Detect patterns
            patterns = self.detect_patterns(img_array)

            # Calculate image hash for change detection
            image_hash = self.calculate_image_hash(img_array)

            return {
                "success": True,
                "entities": entities,
                "game_phase": game_phase,
                "patterns": patterns,
                "image_hash": image_hash,
            }

        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "entities": [],
                "patterns": [],
            }

    def detect_player(self, img_array: np.ndarray) -> dict | None:
        """Detect player character (usually center, distinct color)"""
        try:
            height, width = img_array.shape[:2]

            # Player usually in center of screen
            center_x, center_y = width // 2, height // 2
            radius = min(width, height) // 6

            # Sample center region
            center_region = img_array[
                max(0, center_y - radius) : min(height, center_y + radius),
                max(0, center_x - radius) : min(width, center_x + radius),
            ]

            # Look for skin tone or character color
            if len(img_array.shape) == 3 and img_array.shape[2] >= 3:
                # Check for character silhouette
                hsv = cv2.cvtColor(center_region, cv2.COLOR_RGB2HSV) if CV2_AVAILABLE else None

                if hsv is not None:
                    # Detect skin tone
                    lower = np.array([0, 20, 70])
                    upper = np.array([20, 255, 255])
                    mask = cv2.inRange(hsv, lower, upper)

                    if np.sum(mask) > 1000:  # Significant skin-colored area
                        return {
                            "type": "player",
                            "name": "Player",
                            "position": {"x": center_x, "y": center_y},
                            "confidence": 0.85,
                        }

            # Fallback: return center as player position
            return {
                "type": "player",
                "name": "Player",
                "position": {"x": center_x, "y": center_y},
                "confidence": 0.6,
            }

        except Exception:
            return None

    def detect_enemies(self, img_array: np.ndarray) -> list:
        """Detect enemy entities (red/dark colored, aggressive appearance)"""
        entities = []
        try:
            if not CV2_AVAILABLE:
                return entities

            height, width = img_array.shape[:2]
            hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)

            # Detect red (enemies often red)
            lower_red = np.array([0, 50, 50])
            upper_red = np.array([10, 255, 255])
            mask_red = cv2.inRange(hsv, lower_red, upper_red)

            # Find contours
            contours, _ = cv2.findContours(
                mask_red, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            for i, contour in enumerate(contours):
                area = cv2.contourArea(contour)
                if area > 100:  # Minimum size
                    M = cv2.moments(contour)
                    if M["m00"] > 0:
                        cx = int(M["m10"] / M["m00"])
                        cy = int(M["m01"] / M["m00"])

                        entities.append(
                            {
                                "type": "enemy",
                                "name": f"Enemy_{i}",
                                "position": {"x": cx, "y": cy},
                                "confidence": 0.8,
                            }
                        )

            return entities

        except Exception:
            return []

    def detect_objectives(self, img_array: np.ndarray) -> list:
        """Detect objectives (yellow/bright, important markers)"""
        entities = []
        try:
            if not CV2_AVAILABLE:
                return entities

            hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)

            # Detect yellow (objectives often yellow)
            lower_yellow = np.array([20, 50, 50])
            upper_yellow = np.array([30, 255, 255])
            mask_yellow = cv2.inRange(hsv, lower_yellow, upper_yellow)

            # Find contours
            contours, _ = cv2.findContours(
                mask_yellow, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            for i, contour in enumerate(contours):
                area = cv2.contourArea(contour)
                if area > 50:
                    M = cv2.moments(contour)
                    if M["m00"] > 0:
                        cx = int(M["m10"] / M["m00"])
                        cy = int(M["m01"] / M["m00"])

                        entities.append(
                            {
                                "type": "objective",
                                "name": f"Objective_{i}",
                                "position": {"x": cx, "y": cy},
                                "confidence": 0.85,
                            }
                        )

            return entities

        except Exception:
            return []

    def detect_items(self, img_array: np.ndarray) -> list:
        """Detect collectible items (small, bright, distinct)"""
        entities = []
        try:
            if not CV2_AVAILABLE:
                return entities

            height, width = img_array.shape[:2]
            hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)

            # Detect high saturation areas (items often colorful)
            saturation = hsv[:, :, 1]
            bright_areas = saturation > 150

            # Find contours of bright areas
            contours, _ = cv2.findContours(
                bright_areas.astype(np.uint8) * 255,
                cv2.RETR_EXTERNAL,
                cv2.CHAIN_APPROX_SIMPLE,
            )

            for i, contour in enumerate(contours):
                area = cv2.contourArea(contour)
                if 30 < area < 500:  # Small to medium items
                    M = cv2.moments(contour)
                    if M["m00"] > 0:
                        cx = int(M["m10"] / M["m00"])
                        cy = int(M["m01"] / M["m00"])

                        entities.append(
                            {
                                "type": "item",
                                "name": f"Item_{i}",
                                "position": {"x": cx, "y": cy},
                                "confidence": 0.7,
                            }
                        )

            return entities[:5]  # Limit to 5 items

        except Exception:
            return []

    def detect_npcs(self, img_array: np.ndarray) -> list:
        """Detect NPCs (friendly, distinct appearance)"""
        entities = []
        try:
            if not CV2_AVAILABLE:
                return entities

            hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)

            # Detect green (friendly, NPCs often green)
            lower_green = np.array([35, 50, 50])
            upper_green = np.array([85, 255, 255])
            mask_green = cv2.inRange(hsv, lower_green, upper_green)

            # Find contours
            contours, _ = cv2.findContours(
                mask_green, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
            )

            for i, contour in enumerate(contours):
                area = cv2.contourArea(contour)
                if area > 100:
                    M = cv2.moments(contour)
                    if M["m00"] > 0:
                        cx = int(M["m10"] / M["m00"])
                        cy = int(M["m01"] / M["m00"])

                        entities.append(
                            {
                                "type": "npc",
                                "name": f"NPC_{i}",
                                "position": {"x": cx, "y": cy},
                                "confidence": 0.75,
                            }
                        )

            return entities

        except Exception:
            return []

    def detect_game_phase(self, img_array: np.ndarray) -> str:
        """Detect current game phase (menu, playing, paused, game_over)"""
        try:
            # Simple heuristic: check image characteristics
            # Game over screens are usually darker or have different color balance
            # Menu screens have centered text

            height, width = img_array.shape[:2]

            # Check brightness
            if len(img_array.shape) == 3:
                brightness = np.mean(img_array[:, :, :])
            else:
                brightness = np.mean(img_array)

            if brightness < 50:
                # Very dark - likely menu or game over
                return "game_over"
            elif brightness > 200:
                # Very bright - likely menu
                return "menu"
            else:
                # Normal brightness - likely playing
                return "playing"

        except Exception:
            return "playing"

    def detect_patterns(self, img_array: np.ndarray) -> list:
        """Detect game patterns (blood, fire, explosion, etc.)"""
        patterns = []
        try:
            if not CV2_AVAILABLE:
                return patterns

            hsv = cv2.cvtColor(img_array, cv2.COLOR_RGB2HSV)

            # Detect red patterns (blood, fire)
            lower_red = np.array([0, 100, 100])
            upper_red = np.array([10, 255, 255])
            mask_red = cv2.inRange(hsv, lower_red, upper_red)

            if np.sum(mask_red) > 5000:
                patterns.append("red_pattern_detected")

            # Detect blue patterns (ice, water)
            lower_blue = np.array([100, 100, 100])
            upper_blue = np.array([130, 255, 255])
            mask_blue = cv2.inRange(hsv, lower_blue, upper_blue)

            if np.sum(mask_blue) > 5000:
                patterns.append("blue_pattern_detected")

            # Detect bright patterns (explosion, light)
            brightness = hsv[:, :, 2]
            bright_pixels = np.sum(brightness > 200)

            if bright_pixels > (img_array.shape[0] * img_array.shape[1] * 0.1):
                patterns.append("bright_light_detected")

            return patterns

        except Exception:
            return []

    def calculate_image_hash(self, img_array: np.ndarray) -> str:
        """Calculate simple hash of image for change detection"""
        try:
            # Resize to small size
            small = cv2.resize(img_array, (8, 8)) if CV2_AVAILABLE else img_array[::8, ::8]
            # Convert to grayscale if needed
            if len(small.shape) == 3:
                gray = np.mean(small, axis=2)
            else:
                gray = small
            # Create hash
            hash_value = np.mean(gray) > 128
            return (
                "".join([str(int(x)) for x in gray.flatten()])
                if CV2_AVAILABLE
                else "simple_hash"
            )
        except Exception:
            return "error_hash"


def main():
    """Main entry point"""
    try:
        # Read image data from stdin
        input_data = sys.stdin.read()
        data = json.loads(input_data)
        image_data = data.get("imageData", "")

        # Detect entities
        detector = EntityDetector()
        result = detector.detect_entities(image_data)

        # Output result
        print(json.dumps(result))

    except json.JSONDecodeError as e:
        error_result = {"success": False, "error": f"Invalid JSON: {e}"}
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        error_result = {"success": False, "error": str(e)}
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
