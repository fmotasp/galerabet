import re

with open('src/components/modals/AccessModal.tsx', 'r') as f:
    content = f.read()

# Replace validation block
old_validation = """    if (!title || !login || !password) {
      addToast('Atenção', 'Preencha Site, Login e Senha.', 'warning');
      return;
    }"""

new_validation = """    if (!title) {
      addToast('Atenção', 'Preencha pelo menos o Nome/Título do acesso.', 'warning');
      return;
    }"""

content = content.replace(old_validation, new_validation)

with open('src/components/modals/AccessModal.tsx', 'w') as f:
    f.write(content)

print("Updated successfully")
