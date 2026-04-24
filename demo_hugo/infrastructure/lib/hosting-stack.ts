import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53Targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

const DOMAIN_NAME = 'diegoagtz.com';
const SUBDOMAIN = `demo.${DOMAIN_NAME}`;

export class HostingStack extends cdk.Stack {
  public readonly siteBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: DOMAIN_NAME,
    });

    const certificate = new acm.Certificate(this, 'Certificate', {
      domainName: SUBDOMAIN,
      validation: acm.CertificateValidation.fromDns(zone),
    });

    // S3 Bucket para el sitio estático
    this.siteBucket = new s3.Bucket(this, 'SiteBucket', {
      bucketName: `${this.stackName}-site-${this.account}`,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      lifecycleRules: [
        {
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
      ],
    });

    // CloudFront Distribution (uses Origin Access Control via S3BucketOrigin)
    this.distribution = new cloudfront.Distribution(this, 'Distribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(this.siteBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      domainNames: [SUBDOMAIN],
      certificate,
      defaultRootObject: 'index.html',
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      httpVersion: cloudfront.HttpVersion.HTTP2,
      errorResponses: [
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: '/index.html',
          ttl: cdk.Duration.seconds(0),
        },
        {
          httpStatus: 404,
          responseHttpStatus: 404,
          responsePagePath: '/404.html',
          ttl: cdk.Duration.seconds(30),
        },
      ],
    });

    // Route53 alias record
    new route53.ARecord(this, 'AliasRecord', {
      zone,
      recordName: SUBDOMAIN,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.CloudFrontTarget(this.distribution),
      ),
    });

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.siteBucket.bucketName,
      description: 'S3 bucket name for the static site',
      exportName: `${this.stackName}-bucket-name`,
    });

    new cdk.CfnOutput(this, 'DistributionId', {
      value: this.distribution.distributionId,
      description: 'CloudFront distribution ID',
      exportName: `${this.stackName}-distribution-id`,
    });

    new cdk.CfnOutput(this, 'SiteUrl', {
      value: `https://${SUBDOMAIN}`,
      description: 'Full URL of the deployed site',
    });
  }
}
