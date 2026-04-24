---
title: "Por que Serverless en AWS"
date: 2026-04-21T10:00:00Z
draft: false
description: "Las ventajas de construir aplicaciones serverless con Lambda, API Gateway y DynamoDB"
---

## Sin servidores, sin preocupaciones

Serverless no significa que no hay servidores. Significa que tu no los administras. AWS se encarga del patching, escalamiento y disponibilidad.

### Los tres pilares de nuestra API

**AWS Lambda** ejecuta tu codigo solo cuando lo necesitas. Sin trafico, sin costo.

**API Gateway** expone tus Lambdas como endpoints HTTP. Maneja throttling, autorizacion y versionamiento.

**DynamoDB** escala automaticamente. No hay conexiones que administrar, no hay replicas que configurar.

### Costos reales para una API pequena

| Servicio | Costo mensual estimado |
|----------|----------------------|
| Lambda (1M requests) | $0.20 |
| API Gateway (1M requests) | $3.50 |
| DynamoDB (on-demand, 1GB) | $0.25 |
| **Total** | **~$4/mes** |

### Lo mejor: todo es infraestructura como codigo

Con CDK, defines tu Lambda, tu API Gateway y tu DynamoDB en TypeScript. Un `git push` y el pipeline se encarga del resto.
