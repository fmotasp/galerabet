#!/bin/bash

# ==============================================================================
# RioSãoPaulo - Script Automatizado de Push para o GitHub
# Uso: ./rsp.sh "mensagem opcional" ou apenas rsp
# ==============================================================================

# Cores para o terminal
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # Sem cor

echo -e "\n${BLUE}====================================================${NC}"
echo -e "${BLUE}   🚀 RIOSÃOPAULO - ATUALIZANDO GITHUB (RSP)        ${NC}"
echo -e "${BLUE}====================================================${NC}\n"

# Garante que está no diretório correto do projeto
cd "$(dirname "$0")" || exit

# Mensagem do commit (usa o argumento passado ou a data/hora atual)
COMMIT_MSG="$1"
if [ -z "$COMMIT_MSG" ]; then
  DATA_ATUAL=$(date +"%d/%m/%Y às %H:%M:%S")
  COMMIT_MSG="Atualização RioSãoPaulo ($DATA_ATUAL)"
fi

echo -e "${YELLOW}📦 1. Adicionando arquivos modificados...${NC}"
git add -A

# Verifica se há alterações para commitar
if git diff-index --quiet HEAD -- 2>/dev/null; then
  echo -e "${YELLOW}ℹ️  Nenhuma alteração de código pendente para commit.${NC}"
else
  echo -e "${YELLOW}💾 2. Criando commit: \"${COMMIT_MSG}\"...${NC}"
  git commit -m "$COMMIT_MSG"
fi

# Verifica se o repositório remoto 'origin' está configurado
if git remote | grep -q "origin"; then
  CURRENT_BRANCH=$(git branch --show-current)
  if [ -z "$CURRENT_BRANCH" ]; then
    CURRENT_BRANCH="main"
  fi

  echo -e "${YELLOW}☁️  3. Enviando alterações para o GitHub (branch: ${CURRENT_BRANCH})...${NC}"
  git push -u origin "$CURRENT_BRANCH"

  if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}====================================================${NC}"
    echo -e "${GREEN}  ✅ SUCESSO! Alterações enviadas para o GitHub!    ${NC}"
    echo -e "${GREEN}====================================================${NC}\n"
  else
    echo -e "\n${RED}⚠️  Falha ao fazer push. Verifique suas credenciais do GitHub ou tente git push manualmente.${NC}\n"
  fi
else
  echo -e "\n${YELLOW}⚠️  Aviso: O repositório remoto do GitHub ainda não foi vinculado.${NC}"
  echo -e "Para vincular ao seu repositório no GitHub, execute uma única vez:"
  echo -e "${BLUE}git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git${NC}"
  echo -e "E depois execute novamente: ${GREEN}./rsp.sh${NC} ou ${GREEN}rsp${NC}\n"
fi
