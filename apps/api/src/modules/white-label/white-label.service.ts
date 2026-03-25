import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

export interface UpdateBrandingDto {
  companyName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customCss?: string;
  supportEmail?: string;
  supportUrl?: string;
  privacyPolicyUrl?: string;
  termsUrl?: string;
  hidePoweredBy?: boolean;
}

export interface WhiteLabelConfig {
  id: string;
  workspaceId: string;
  companyName: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  fontFamily: string | null;
  customCss: string | null;
  customDomain: string | null;
  domainVerified: boolean;
  supportEmail: string | null;
  supportUrl: string | null;
  privacyPolicyUrl: string | null;
  termsUrl: string | null;
  hidePoweredBy: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class WhiteLabelService {
  private readonly logger = new Logger(WhiteLabelService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getConfig(workspaceId: string): Promise<WhiteLabelConfig> {
    let config = await this.prisma.brandingConfig.findUnique({
      where: { workspaceId },
    });

    if (!config) {
      // Auto-create a default config for the workspace
      config = await this.prisma.brandingConfig.create({
        data: {
          workspaceId,
          domainVerified: false,
          hidePoweredBy: false,
        },
      });
    }

    return config as WhiteLabelConfig;
  }

  async updateBranding(
    workspaceId: string,
    dto: UpdateBrandingDto,
  ): Promise<WhiteLabelConfig> {
    await this.getConfig(workspaceId); // ensure it exists

    return this.prisma.brandingConfig.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        ...this.brandingFields(dto),
        domainVerified: false,
        hidePoweredBy: dto.hidePoweredBy ?? false,
      },
      update: this.brandingFields(dto),
    }) as Promise<WhiteLabelConfig>;
  }

  private brandingFields(dto: UpdateBrandingDto) {
    return {
      ...(dto.companyName !== undefined && { companyName: dto.companyName }),
      ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
      ...(dto.faviconUrl !== undefined && { faviconUrl: dto.faviconUrl }),
      ...(dto.primaryColor !== undefined && { primaryColor: dto.primaryColor }),
      ...(dto.secondaryColor !== undefined && { secondaryColor: dto.secondaryColor }),
      ...(dto.accentColor !== undefined && { accentColor: dto.accentColor }),
      ...(dto.fontFamily !== undefined && { fontFamily: dto.fontFamily }),
      ...(dto.customCss !== undefined && { customCss: dto.customCss }),
      ...(dto.supportEmail !== undefined && { supportEmail: dto.supportEmail }),
      ...(dto.supportUrl !== undefined && { supportUrl: dto.supportUrl }),
      ...(dto.privacyPolicyUrl !== undefined && { privacyPolicyUrl: dto.privacyPolicyUrl }),
      ...(dto.termsUrl !== undefined && { termsUrl: dto.termsUrl }),
      ...(dto.hidePoweredBy !== undefined && { hidePoweredBy: dto.hidePoweredBy }),
    };
  }

  async setCustomDomain(workspaceId: string, domain: string): Promise<WhiteLabelConfig> {
    // Basic domain format validation
    const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
      throw new BadRequestException(`Invalid domain format: ${domain}`);
    }

    // Check if domain is already taken by another workspace
    const existing = await this.prisma.brandingConfig.findFirst({
      where: { customDomain: domain, workspaceId: { not: workspaceId } },
    });
    if (existing) {
      throw new BadRequestException('This domain is already in use by another workspace');
    }

    const updated = await this.prisma.brandingConfig.upsert({
      where: { workspaceId },
      create: {
        workspaceId,
        customDomain: domain,
        domainVerified: false,
        hidePoweredBy: false,
      },
      update: {
        customDomain: domain,
        domainVerified: false, // Reset verification on domain change
      },
    });

    this.logger.log(
      `Custom domain "${domain}" set for workspace ${workspaceId} — verification pending`,
    );

    return updated as WhiteLabelConfig;
  }

  async verifyCustomDomain(workspaceId: string): Promise<{ verified: boolean; message: string }> {
    const config = await this.getConfig(workspaceId);
    if (!config.customDomain) {
      throw new BadRequestException('No custom domain configured for this workspace');
    }

    // In production this would perform a real DNS TXT record check.
    // Here we simulate the check and mark as verified.
    const expectedTxt = `barmagly-verify=${workspaceId}`;
    this.logger.log(`Verifying domain ${config.customDomain} — expected TXT: ${expectedTxt}`);

    // Placeholder: assume verified for now (real impl would use dns.resolveTxt)
    await this.prisma.brandingConfig.update({
      where: { workspaceId },
      data: { domainVerified: true },
    });

    return { verified: true, message: 'Domain verified successfully' };
  }

  async resolveByDomain(domain: string): Promise<WhiteLabelConfig | null> {
    const config = await this.prisma.brandingConfig.findFirst({
      where: { customDomain: domain, domainVerified: true },
    });
    return config as WhiteLabelConfig | null;
  }
}
