# Demo 1: Sitio Estático Hugo con AWS CI/CD

Sitio estático generado con Hugo, desplegado automáticamente a AWS S3 + CloudFront mediante un pipeline CI/CD con CodePipeline y CodeBuild. Infraestructura definida con AWS CDK (TypeScript).

## Arquitectura

```
┌─────────┐     ┌──────────────┐     ┌───────────┐     ┌────┐     ┌────────────┐
│  GitHub  │────▶│ CodePipeline │────▶│ CodeBuild │────▶│ S3 │────▶│ CloudFront │
│  (push)  │     │  (webhook)   │     │  (Hugo)   │     │    │     │   (CDN)    │
└─────────┘     └──────────────┘     └───────────┘     └────┘     └────────────┘
```

**Flujo:** `git push` → CodePipeline detecta → CodeBuild instala Hugo y genera el sitio → sync a S3 → invalidación de cache CloudFront → sitio actualizado (~2-3 min). 

## Stack Tecnológico

| Componente | Tecnología |
|-----------|-----------|
| Generador estático | Hugo |
| Hosting | Amazon S3 (privado, vía OAI) |
| CDN | CloudFront (HTTPS, HTTP/2) |
| IaC | AWS CDK v2 (TypeScript) |
| CI/CD | CodePipeline + CodeBuild |
| Source | GitHub (webhook) |

## Pre-requisitos

- **AWS Account** activa con permisos de administrador
- **AWS CLI** v2 configurado (`aws configure`)
- **Node.js** 18+
- **AWS CDK** v2 instalado globalmente: `npm install -g aws-cdk`
- **Hugo** instalado localmente (para desarrollo): [gohugo.io/installation](https://gohugo.io/installation/)
- **GitHub token** con permisos `repo` y `admin:repo_hook`

## Setup Inicial

### 1. Clonar el repositorio

```bash
git clone <tu-repo>
cd demo-1-hugo
```

### 2. Instalar dependencias CDK

```bash
cd infrastructure
npm install
cd ..
```

### 3. Configurar variables de entorno

```bash
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
export CDK_DEFAULT_REGION=us-east-1
export GITHUB_OWNER=tu-github-username
export GITHUB_REPO=nombre-del-repo
```

### 4. Guardar GitHub token en Secrets Manager

```bash
aws secretsmanager create-secret \
  --name github-token \
  --region us-east-1 \
  --secret-string "ghp_TU_TOKEN_AQUI"
```

> El token necesita permisos `repo` (acceso completo al repositorio) y `admin:repo_hook` (para crear webhooks).

### 5. Desplegar

```bash
./scripts/deploy.sh
```

El script desplegará:
1. **HostingStack**: S3 bucket + CloudFront distribution
2. **PipelineStack**: CodePipeline + CodeBuild (requiere GITHUB_OWNER y GITHUB_REPO)

## Estructura del Proyecto

```
demo-1-hugo/
├── README.md                    # Este archivo
├── .gitignore
├── buildspec.yml                # Instrucciones de build para CodeBuild
├── hugo-site/                   # Sitio Hugo
│   ├── config.toml              # Configuración de Hugo
│   ├── content/                 # Contenido en Markdown
│   │   ├── _index.md            # Página principal
│   │   └── posts/               # Blog posts
│   ├── layouts/                 # Templates HTML
│   │   ├── _default/            # Layouts por defecto
│   │   ├── partials/            # Header, footer
│   │   └── index.html           # Layout del home
│   ├── static/css/style.css     # Estilos (tema DoomOne)
│   └── archetypes/              # Templates para nuevo contenido
├── infrastructure/              # AWS CDK (TypeScript)
│   ├── bin/infrastructure.ts    # Entry point CDK
│   └── lib/
│       ├── hosting-stack.ts     # S3 + CloudFront
│       └── pipeline-stack.ts    # CodePipeline + CodeBuild
└── scripts/
    ├── deploy.sh                # Script de despliegue
    └── destroy.sh               # Script de limpieza
```

## Desarrollo Local

```bash
cd hugo-site
hugo server -D
```

Abre [http://localhost:1313](http://localhost:1313) para ver el sitio localmente. Hugo recompila automáticamente al guardar cambios.

## Probar la Demo en Vivo

1. **Editar contenido** - Abre `hugo-site/content/_index.md` y modifica el texto de bienvenida
2. **Cambiar el botón CTA** - En `hugo-site/static/css/style.css`, cambia `.cta-button { background-color: }` de `var(--green)` a `var(--magenta)`
3. **Commit y push**:
   ```bash
   git add -A
   git commit -m "Cambiar color del botón CTA"
   git push
   ```
4. **Observar el pipeline** en la [consola de CodePipeline](https://console.aws.amazon.com/codesuite/codepipeline/pipelines)
5. **Ver el resultado** en la URL de CloudFront (disponible en los outputs del stack)
6. **Tiempo esperado:** 1-3 minutos

### Elementos para demostrar cambios

| Elemento | Archivo | Qué cambiar |
|---------|---------|-------------|
| Botón CTA | `static/css/style.css` | `background-color` en `.cta-button` |
| Badge versión | `config.toml` | `siteVersion` (ej: "v1.0" → "v2.0") |
| Texto principal | `content/_index.md` | Párrafo de bienvenida |
| Color de acento | `static/css/style.css` | Variables CSS en `:root` |

## Troubleshooting

**Pipeline no se dispara al hacer push:**
- Verifica que el webhook se creó en GitHub (Settings → Webhooks)
- Revisa que el token tiene permisos `admin:repo_hook`
- Verifica la rama configurada (default: `main`)

**Build falla en CodeBuild:**
- Revisa los logs en [CloudWatch Logs](https://console.aws.amazon.com/cloudwatch/home#logsV2:log-groups)
- Verifica que `buildspec.yml` está en la raíz del repo
- Comprueba que la versión de Hugo en `buildspec.yml` existe

**CloudFront no muestra cambios:**
- El pipeline crea una invalidación automática, pero puede tardar 1-2 minutos
- Fuerza refresh: `Ctrl+Shift+R` o `Cmd+Shift+R`
- Verifica el estado de la invalidación en la consola de CloudFront

**Error "Access Denied" al acceder al sitio:**
- Verifica que el OAI está correctamente configurado
- Asegúrate de que los archivos existen en S3 con `aws s3 ls s3://BUCKET_NAME/`

## Costos Aproximados

| Servicio | Costo mensual |
|---------|--------------|
| CodePipeline | $1.00 |
| CodeBuild | ~$0.50 (uso bajo) |
| S3 | < $0.10 |
| CloudFront | < $1.00 (tráfico bajo) |
| Secrets Manager | $0.40 |
| **Total** | **~$2-3/mes** |

> Para minimizar costos, destruye los recursos cuando no los uses: `./scripts/destroy.sh`

## Cleanup

```bash
./scripts/destroy.sh
```

Esto elimina todos los recursos AWS. La distribución CloudFront puede tardar ~15 minutos en deshabilitarse completamente.

## Recursos

- [Documentación Hugo](https://gohugo.io/documentation/)
- [AWS CDK Developer Guide](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [AWS CodePipeline](https://docs.aws.amazon.com/codepipeline/latest/userguide/)
- [AWS CodeBuild](https://docs.aws.amazon.com/codebuild/latest/userguide/)
