#!/usr/bin/env bash
set -euo pipefail

echo "============================================"
echo "  Deploy Demo Hugo - S3 + CloudFront + CI/CD"
echo "============================================"
echo ""

# Verificar AWS CLI
if ! command -v aws &> /dev/null; then
  echo "ERROR: AWS CLI no está instalado."
  echo "Instálalo: https://docs.aws.amazon.com/cli/latest/userguide/install-cliv2.html"
  exit 1
fi

# Verificar identidad AWS
echo "Verificando credenciales AWS..."
AWS_IDENTITY=$(aws sts get-caller-identity --output text --query 'Account' 2>/dev/null) || {
  echo "ERROR: No se pudo verificar la identidad AWS. Configura tus credenciales."
  exit 1
}
echo "AWS Account: ${AWS_IDENTITY}"

# Verificar CDK
if ! command -v cdk &> /dev/null; then
  echo "ERROR: AWS CDK no está instalado."
  echo "Instálalo: npm install -g aws-cdk"
  exit 1
fi

# Verificar variables de entorno
export CDK_DEFAULT_ACCOUNT="${CDK_DEFAULT_ACCOUNT:-$AWS_IDENTITY}"
export CDK_DEFAULT_REGION="${CDK_DEFAULT_REGION:-us-east-1}"

echo "Region: ${CDK_DEFAULT_REGION}"
echo ""

# Instalar dependencias CDK
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
INFRA_DIR="${PROJECT_DIR}/infrastructure"

echo "Instalando dependencias CDK..."
cd "$INFRA_DIR"
npm install

# Bootstrap CDK (si es necesario)
echo ""
echo "Ejecutando CDK bootstrap..."
cdk bootstrap "aws://${CDK_DEFAULT_ACCOUNT}/${CDK_DEFAULT_REGION}" || {
  echo "NOTA: Si el bootstrap ya existe, este error es esperado."
}

# Deploy HostingStack
echo ""
echo "============================================"
echo "  Desplegando HostingStack (S3 + CloudFront)"
echo "============================================"
cdk deploy demo-hugo-hosting --require-approval never

echo ""
echo "HostingStack desplegado exitosamente."
echo ""

# Verificar variables para PipelineStack
if [[ -z "${GITHUB_OWNER:-}" || -z "${GITHUB_REPO:-}" ]]; then
  echo "============================================"
  echo "  GITHUB_OWNER y GITHUB_REPO requeridos"
  echo "============================================"
  echo ""
  echo "Para desplegar el PipelineStack, configura:"
  echo "  export GITHUB_OWNER=tu-usuario-github"
  echo "  export GITHUB_REPO=nombre-del-repo"
  echo ""
  echo "También necesitas un token en Secrets Manager:"
  echo '  aws secretsmanager create-secret --name github-token --secret-string "ghp_TU_TOKEN"'
  echo ""
  read -rp "Deseas continuar con el PipelineStack? (s/n): " CONTINUE
  if [[ "$CONTINUE" != "s" ]]; then
    echo "PipelineStack no desplegado. Ejecuta este script de nuevo cuando estés listo."
    exit 0
  fi
fi

# Deploy PipelineStack
echo ""
echo "============================================"
echo "  Desplegando PipelineStack (CI/CD)"
echo "============================================"
cdk deploy demo-hugo-pipeline --require-approval never

echo ""
echo "============================================"
echo "  Deploy completado"
echo "============================================"
echo ""
echo "Revisa los outputs del stack en la consola de AWS CloudFormation"
echo "o ejecuta: cdk outputs"
