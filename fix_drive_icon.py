import re

with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    content = f.read()

# Replace the current SVG with a standard high-quality Google Drive SVG
old_svg = """              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 48 48">
                <path fill="#FFC107" d="M17 6l-11.4 20h22.8L39.8 6z" />
                <path fill="#1976D2" d="M11.3 35.8l-5.7-10 11.4-20 5.7 10z" />
                <path fill="#4CAF50" d="M36.7 35.8H13.9l5.7-10h22.8z" />
              </svg>"""

new_svg = """              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 87.3 122.88">
                <path fill="#0066da" d="M30.4,122.88L0,66.8l27.13-46.7l31.57,55.83l-28.3,46.95z"/>
                <path fill="#00ac47" d="M87.3,66.8L56.9,122.88H0l30.4-56.08h56.9z"/>
                <path fill="#ea4335" d="M87.3,66.8L56.9,122.88l-26.5-46.73L61.71,20.1l25.59,46.7z"/>
                <path fill="#00832d" d="M0,66.8l27.13-46.7L56.9,122.88H0z"/>
                <path fill="#2684fc" d="M87.3,66.8L61.71,20.1L30.4,66.8h56.9z"/>
                <path fill="#ffba00" d="M27.13,20.1L57.53,76.18L87.3,66.8L57.53,20.1H27.13z"/>
              </svg>"""
              
# A more accurate standard Google drive SVG:
better_new_svg = """              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 512 512">
                <path fill="#34A853" d="M169.5 59.4l-84.5 146.4H512l-84.7-146.4H169.5z"/>
                <path fill="#4285F4" d="M84.7 205.8L0 352.2 169.5 512l84.5-146.2L84.7 205.8z"/>
                <path fill="#FBBC05" d="M512 205.8h-169.5L169.5 512l84.7 146.2L512 205.8z"/>
              </svg>"""
# Actually, those paths look wrong (Google drive has overlapping colors, the standard 3 polygons are best).
# Let's use the simplest, most accurate Google Drive vector paths (the one that exactly matches the triangle with 3 colors):
best_svg = """              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 87.3 122.88" preserveAspectRatio="xMidYMid meet">
                <path fill="#0066da" d="M56.897,122.88H0l30.395-56.079h56.904L56.897,122.88L56.897,122.88z"/>
                <path fill="#00ac47" d="M87.299,66.801L56.897,122.88L30.395,66.801l27.136-46.7h30.4v46.7H87.299z"/>
                <path fill="#ea4335" d="M87.299,66.801L61.713,20.101h-30.4l26.216,46.7H87.299L87.299,66.801z"/>
                <path fill="#00832d" d="M30.395,66.801l26.502,56.079l30.402-56.079H30.395L30.395,66.801z"/>
                <path fill="#2684fc" d="M30.395,66.801H0l27.136-46.7l30.395,46.7H30.395L30.395,66.801z"/>
                <path fill="#ffba00" d="M57.531,20.101H27.136L0,66.801h30.395L57.531,20.101L57.531,20.101z"/>
              </svg>"""

# Wait, Google drive SVG is usually 3 polygons:
google_drive_clean = """              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 1443.061 1249.993">
                <path fill="#3777e3" d="M240.525 1249.993l240.492-416.664h962.044l-240.514 416.664z"/>
                <path fill="#ffcf63" d="M962.055 833.329h481.006L962.055 0H481.017z"/>
                <path fill="#11a861" d="M0 833.329l240.525 416.664 481.006-833.329L481.017 0z"/>
              </svg>"""

content = content.replace(old_svg, google_drive_clean)

with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(content)

print("Icon updated successfully")
