import os

path = r"c:\Users\ADVAITH G\Documents\AIVENTRA\backend\routes\analysis.py"

with open(path, "r", encoding="utf-8") as f:
    content = f.read()

target = """    if evidence_count == 0:
        raise HTTPException(
            status_code=400,
            detail="No evidence files uploaded for this case"
        )"""

replacement = """    if evidence_count == 0:
        log_info("Warning: No evidence files uploaded for this case, proceeding with empty context")"""

if target in content:
    content = content.replace(target, replacement)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    print("Replaced!")
else:
    print("Target not found.")
