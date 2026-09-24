import re

with open('src/components/accesses/AccessesView.tsx', 'r') as f:
    content = f.read()

# Find the end of filteredAccesses definition
# It ends with:
#     return (
#       acc.title.toLowerCase().includes(q) ||
#       acc.login.toLowerCase().includes(q)
#     );
#   });

old_filter_end = """    return (
      acc.title.toLowerCase().includes(q) ||
      acc.login.toLowerCase().includes(q)
    );
  });"""

new_filter_end = """    return (
      acc.title.toLowerCase().includes(q) ||
      acc.login.toLowerCase().includes(q)
    );
  }).sort((a, b) => a.title.localeCompare(b.title));"""

content = content.replace(old_filter_end, new_filter_end)

with open('src/components/accesses/AccessesView.tsx', 'w') as f:
    f.write(content)

print("Updated successfully")
