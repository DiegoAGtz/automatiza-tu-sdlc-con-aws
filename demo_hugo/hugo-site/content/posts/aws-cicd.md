---
title: "CI/CD en AWS: Una Guía Práctica"
date: 2026-04-22T11:00:00-06:00
draft: false
description: "Cómo implementar CI/CD en AWS usando CodePipeline y CodeBuild"
---

## Por qué CI/CD importa

El Continuous Integration y Continuous Deployment (CI/CD) es la columna vertebral de cualquier equipo de desarrollo moderno. Con AWS, puedes construir pipelines robustos y escalables con servicios nativos. Buenos días a todos.

### Los servicios clave

**AWS CodePipeline** orquesta todo el flujo:

```
GitHub Push → CodePipeline → CodeBuild → S3 → CloudFront
```

**AWS CodeBuild** ejecuta los builds:

```bash
# Instalar Hugo
wget hugo_extended_linux-amd64.tar.gz
tar -xzf hugo_extended_linux-amd64.tar.gz

# Construir el sitio
hugo --minify --gc

# Desplegar a S3
aws s3 sync public/ s3://mi-bucket/ --delete
```

### Ventajas de este enfoque

1. **Sin servidores que mantener** - Todo es serverless
2. **Pago por uso** - Solo pagas cuando el pipeline ejecuta
3. **Escalable** - CloudFront distribuye tu contenido globalmente
4. **Seguro** - S3 privado, acceso solo via CloudFront con OAI

### Costos reales

Para un sitio como este, el costo mensual es aproximadamente:

- CodePipeline: **$1.00/mes**
- CodeBuild: **~$0.50/mes**
- S3: **< $0.10/mes**
- CloudFront: **< $1.00/mes**

**Total: ~$2-3/mes** - menos que un café.

### Próximos pasos

En futuros posts exploraremos:
- Cómo agregar tests automatizados al pipeline
- Implementar ambientes de staging y producción
- Monitoreo y alertas con CloudWatch
