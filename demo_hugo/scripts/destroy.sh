#!/usr/bin/env bash
set -euo pipefail

echo "============================================"
echo "  Destruir Demo Hugo - Cleanup completo"
echo "============================================"
echo ""
echo "ADVERTENCIA: Esto eliminará TODOS los recursos AWS de esta demo."
echo ""
read -rp "Estás seguro? Escribe 'si' para confirmar: " CONFIRM

if [[ "$CONFIRM" != "si" ]]; then
  echo "Operación cancelada."
  exit 0
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
INFRA_DIR="${PROJECT_DIR}/infrastructure"

cd "$INFRA_DIR"

export CDK_DEFAULT_ACCOUNT="${CDK_DEFAULT_ACCOUNT:-$(aws sts get-caller-identity --output text --query 'Account')}"
export CDK_DEFAULT_REGION="${CDK_DEFAULT_REGION:-us-east-1}"

# Destruir PipelineStack primero
echo ""
echo "Destruyendo PipelineStack..."
cdk destroy demo-hugo-pipeline --force 2>/dev/null || echo "PipelineStack ya no existe o no se pudo destruir."

# Destruir HostingStack
# Nota: autoDeleteObjects en CDK se encarga de vaciar el bucket
echo ""
echo "Destruyendo HostingStack..."
echo "NOTA: La distribución CloudFront puede tardar ~15 minutos en eliminarse."
cdk destroy demo-hugo-hosting --force

echo ""
echo "============================================"
echo "  Cleanup completado"
echo "============================================"
echo ""
echo "Todos los recursos han sido eliminados."
echo "La distribución CloudFront puede seguir deshabilitándose por unos minutos."
