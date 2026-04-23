---
title: "Automatiza tu SDLC con AWS"
date: 2026-04-22T13:00:00Z
draft: false
description: "Como construimos este monorepo con dos pipelines independientes usando CDK y CodePipeline"
---

## De codigo a produccion en minutos

Este sitio que estas leyendo se despliega automaticamente cada vez que hacemos push a `main`. No hay servidores, no hay deploys manuales, no hay SSH.

### La arquitectura

Nuestro monorepo tiene dos aplicaciones independientes, cada una con su propio pipeline:

```
automatiza-tu-sdlc-con-aws/
  demo_hugo/         -> demo.diegoagtz.com
  demo_api/          -> api.diegoagtz.com
```

**Hugo pipeline:** push a `demo_hugo/**` dispara CodeBuild, que construye el sitio con Hugo y lo sube a S3 + CloudFront.

**Books API pipeline:** push a `demo_api/**` dispara CDK Pipelines, que despliega la API a tres ambientes (Dev, QA, Prod) con aprobaciones manuales entre cada uno.

### Lo interesante

Cada pipeline solo se ejecuta cuando cambian archivos en su directorio. Un cambio en el blog no redespliega la API, y viceversa. Esto se logra con **V2 pipeline triggers** y filtros de file path.

### El stack completo

| Servicio | Uso |
|----------|-----|
| CDK | Infraestructura como codigo |
| CodePipeline V2 | Orquestacion CI/CD |
| CodeBuild | Build y tests |
| S3 + CloudFront | Hosting del sitio |
| Lambda + API Gateway | API REST |
| DynamoDB | Base de datos |
| Route53 + ACM | Dominios y certificados |

Todo definido en TypeScript, todo versionado, todo automatizado.
