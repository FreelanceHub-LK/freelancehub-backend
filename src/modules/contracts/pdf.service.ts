import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as Handlebars from 'handlebars';
import { Contract } from './schemas/contract.schema';

@Injectable()
export class ContractPdfService {
  private readonly logger = new Logger(ContractPdfService.name);

  async generateContractPdf(contractData: any): Promise<Buffer> {
    this.logger.log(`Generating PDF for contract: ${contractData._id}`);

    const htmlTemplate = this.getContractHtmlTemplate();
    const template = Handlebars.compile(htmlTemplate);
    
    // Prepare data for template
    const templateData = this.prepareTemplateData(contractData);
    const html = template(templateData);

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '1cm',
          right: '1cm',
          bottom: '1cm',
          left: '1cm'
        }
      });

      this.logger.log(`PDF generated successfully for contract: ${contractData._id}`);
      return pdfBuffer;
    } catch (error) {
      this.logger.error(`Error generating PDF: ${error.message}`);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  private prepareTemplateData(contractData: any) {
    return {
      contract: {
        id: contractData._id,
        title: contractData.title,
        description: contractData.description,
        type: contractData.type,
        status: contractData.status,
        amount: (contractData.amount / 100).toFixed(2), // Convert cents to dollars
        currency: contractData.currency,
        hourlyRate: contractData.hourlyRate ? (contractData.hourlyRate / 100).toFixed(2) : null,
        estimatedHours: contractData.estimatedHours,
        startDate: this.formatDate(contractData.startDate),
        endDate: this.formatDate(contractData.endDate),
        terms: contractData.terms,
        scope: contractData.scope,
        paymentTerms: contractData.paymentTerms,
        platformFee: contractData.platformFee,
        paidAmount: (contractData.paidAmount / 100).toFixed(2),
        createdAt: this.formatDate(contractData.createdAt),
        completedAt: contractData.completedAt ? this.formatDate(contractData.completedAt) : null,
      },
      project: {
        title: contractData.project?.title || 'N/A',
        description: contractData.project?.description || 'N/A',
        budget: contractData.project?.budget ? (contractData.project.budget / 100).toFixed(2) : 'N/A',
        deadline: contractData.project?.deadline ? this.formatDate(contractData.project.deadline) : 'N/A',
        category: contractData.project?.category?.name || 'N/A',
      },
      client: {
        name: contractData.client ? `${contractData.client.firstName || ''} ${contractData.client.lastName || ''}`.trim() : 'N/A',
        email: contractData.client?.email || 'N/A',
        company: contractData.client?.company || 'N/A',
      },
      freelancer: {
        name: contractData.freelancer ? `${contractData.freelancer.firstName || ''} ${contractData.freelancer.lastName || ''}`.trim() : 'N/A',
        email: contractData.freelancer?.email || 'N/A',
        skills: contractData.freelancerProfile?.skills || [],
        hourlyRate: contractData.freelancerProfile?.hourlyRate ? (contractData.freelancerProfile.hourlyRate / 100).toFixed(2) : 'N/A',
      },
      milestones: contractData.milestones?.map((milestone: any) => ({
        title: milestone.title,
        description: milestone.description,
        amount: (milestone.amount / 100).toFixed(2),
        dueDate: this.formatDate(milestone.dueDate),
        status: milestone.status,
        submittedAt: milestone.submittedAt ? this.formatDate(milestone.submittedAt) : null,
        approvedAt: milestone.approvedAt ? this.formatDate(milestone.approvedAt) : null,
        paidAt: milestone.paidAt ? this.formatDate(milestone.paidAt) : null,
      })) || [],
      signatures: {
        client: contractData.clientSignature ? {
          signedAt: this.formatDate(contractData.clientSignature.signedAt),
          ipAddress: contractData.clientSignature.ipAddress,
        } : null,
        freelancer: contractData.freelancerSignature ? {
          signedAt: this.formatDate(contractData.freelancerSignature.signedAt),
          ipAddress: contractData.freelancerSignature.ipAddress,
        } : null,
      },
      generatedAt: this.formatDate(new Date()),
    };
  }

  private formatDate(date: Date | string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  private getContractHtmlTemplate(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract Agreement - {{contract.title}}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background: #fff;
        }
        .header {
            text-align: center;
            border-bottom: 3px solid #007bff;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #007bff;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            margin: 5px 0;
            color: #666;
        }
        .section {
            margin-bottom: 30px;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            padding: 20px;
        }
        .section h2 {
            color: #007bff;
            border-bottom: 2px solid #e9ecef;
            padding-bottom: 10px;
            margin-top: 0;
            font-size: 20px;
        }
        .section h3 {
            color: #495057;
            font-size: 16px;
            margin-bottom: 10px;
        }
        .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 20px;
        }
        .info-item {
            background: #f8f9fa;
            padding: 12px;
            border-radius: 5px;
            border-left: 4px solid #007bff;
        }
        .info-item strong {
            color: #495057;
            display: block;
            margin-bottom: 5px;
        }
        .milestone {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 15px;
            margin-bottom: 15px;
        }
        .milestone h4 {
            margin: 0 0 10px 0;
            color: #007bff;
        }
        .milestone-status {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .status-pending { background: #fff3cd; color: #856404; }
        .status-in_progress { background: #cce5ff; color: #004085; }
        .status-approved { background: #d4edda; color: #155724; }
        .status-paid { background: #d1ecf1; color: #0c5460; }
        .status-active { background: #d4edda; color: #155724; }
        .status-completed { background: #d1ecf1; color: #0c5460; }
        .status-draft { background: #f8d7da; color: #721c24; }
        .signature-section {
            border-top: 2px solid #007bff;
            padding-top: 20px;
            margin-top: 30px;
        }
        .signature-box {
            border: 2px dashed #007bff;
            padding: 20px;
            margin: 15px 0;
            text-align: center;
            background: #f8f9fa;
        }
        .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e9ecef;
            color: #666;
            font-size: 12px;
        }
        .amount-highlight {
            font-size: 18px;
            font-weight: bold;
            color: #28a745;
        }
        .skills-list {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
        }
        .skill-tag {
            background: #007bff;
            color: white;
            padding: 4px 10px;
            border-radius: 15px;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>FREELANCE CONTRACT AGREEMENT</h1>
        <p><strong>Contract ID:</strong> {{contract.id}}</p>
        <p><strong>Generated on:</strong> {{generatedAt}}</p>
    </div>

    <div class="section">
        <h2>Contract Overview</h2>
        <div class="info-grid">
            <div class="info-item">
                <strong>Contract Title</strong>
                {{contract.title}}
            </div>
            <div class="info-item">
                <strong>Contract Type</strong>
                {{contract.type}}
            </div>
            <div class="info-item">
                <strong>Status</strong>
                <span class="milestone-status status-{{contract.status}}">{{contract.status}}</span>
            </div>
            <div class="info-item">
                <strong>Total Amount</strong>
                <span class="amount-highlight">{{contract.currency}} {{contract.amount}}</span>
            </div>
            <div class="info-item">
                <strong>Start Date</strong>
                {{contract.startDate}}
            </div>
            <div class="info-item">
                <strong>End Date</strong>
                {{contract.endDate}}
            </div>
            {{#if contract.hourlyRate}}
            <div class="info-item">
                <strong>Hourly Rate</strong>
                {{contract.currency}} {{contract.hourlyRate}}/hour
            </div>
            {{/if}}
            {{#if contract.estimatedHours}}
            <div class="info-item">
                <strong>Estimated Hours</strong>
                {{contract.estimatedHours}} hours
            </div>
            {{/if}}
        </div>
        <div class="info-item">
            <strong>Description</strong>
            {{contract.description}}
        </div>
    </div>

    <div class="section">
        <h2>Project Details</h2>
        <div class="info-grid">
            <div class="info-item">
                <strong>Project Title</strong>
                {{project.title}}
            </div>
            <div class="info-item">
                <strong>Category</strong>
                {{project.category}}
            </div>
            <div class="info-item">
                <strong>Project Budget</strong>
                {{project.budget}}
            </div>
            <div class="info-item">
                <strong>Project Deadline</strong>
                {{project.deadline}}
            </div>
        </div>
        <div class="info-item">
            <strong>Project Description</strong>
            {{project.description}}
        </div>
    </div>

    <div class="section">
        <h2>Party Information</h2>
        <h3>Client Details</h3>
        <div class="info-grid">
            <div class="info-item">
                <strong>Name</strong>
                {{client.name}}
            </div>
            <div class="info-item">
                <strong>Email</strong>
                {{client.email}}
            </div>
            {{#if client.company}}
            <div class="info-item">
                <strong>Company</strong>
                {{client.company}}
            </div>
            {{/if}}
        </div>

        <h3>Freelancer Details</h3>
        <div class="info-grid">
            <div class="info-item">
                <strong>Name</strong>
                {{freelancer.name}}
            </div>
            <div class="info-item">
                <strong>Email</strong>
                {{freelancer.email}}
            </div>
            {{#if freelancer.hourlyRate}}
            <div class="info-item">
                <strong>Standard Rate</strong>
                {{contract.currency}} {{freelancer.hourlyRate}}/hour
            </div>
            {{/if}}
        </div>
        {{#if freelancer.skills.length}}
        <div class="info-item">
            <strong>Skills</strong>
            <div class="skills-list">
                {{#each freelancer.skills}}
                <span class="skill-tag">{{this}}</span>
                {{/each}}
            </div>
        </div>
        {{/if}}
    </div>

    {{#if contract.scope}}
    <div class="section">
        <h2>Scope of Work</h2>
        <div class="info-item">
            {{contract.scope}}
        </div>
    </div>
    {{/if}}

    {{#if milestones.length}}
    <div class="section">
        <h2>Project Milestones</h2>
        {{#each milestones}}
        <div class="milestone">
            <h4>{{title}} <span class="milestone-status status-{{status}}">{{status}}</span></h4>
            <p><strong>Description:</strong> {{description}}</p>
            <div class="info-grid">
                <div class="info-item">
                    <strong>Amount</strong>
                    {{../contract.currency}} {{amount}}
                </div>
                <div class="info-item">
                    <strong>Due Date</strong>
                    {{dueDate}}
                </div>
                {{#if submittedAt}}
                <div class="info-item">
                    <strong>Submitted</strong>
                    {{submittedAt}}
                </div>
                {{/if}}
                {{#if approvedAt}}
                <div class="info-item">
                    <strong>Approved</strong>
                    {{approvedAt}}
                </div>
                {{/if}}
                {{#if paidAt}}
                <div class="info-item">
                    <strong>Paid</strong>
                    {{paidAt}}
                </div>
                {{/if}}
            </div>
        </div>
        {{/each}}
    </div>
    {{/if}}

    {{#if contract.terms}}
    <div class="section">
        <h2>Terms and Conditions</h2>
        <div class="info-item">
            {{contract.terms}}
        </div>
    </div>
    {{/if}}

    {{#if contract.paymentTerms}}
    <div class="section">
        <h2>Payment Terms</h2>
        <div class="info-item">
            {{contract.paymentTerms}}
        </div>
        <div class="info-grid">
            <div class="info-item">
                <strong>Platform Fee</strong>
                {{contract.platformFee}}%
            </div>
            <div class="info-item">
                <strong>Amount Paid</strong>
                <span class="amount-highlight">{{contract.currency}} {{contract.paidAmount}}</span>
            </div>
        </div>
    </div>
    {{/if}}

    <div class="section signature-section">
        <h2>Digital Signatures</h2>
        {{#if signatures.client}}
        <div class="signature-box">
            <h3>Client Signature</h3>
            <p><strong>Signed by:</strong> {{client.name}}</p>
            <p><strong>Date:</strong> {{signatures.client.signedAt}}</p>
            <p><strong>IP Address:</strong> {{signatures.client.ipAddress}}</p>
        </div>
        {{else}}
        <div class="signature-box">
            <h3>Client Signature</h3>
            <p>Not yet signed</p>
        </div>
        {{/if}}

        {{#if signatures.freelancer}}
        <div class="signature-box">
            <h3>Freelancer Signature</h3>
            <p><strong>Signed by:</strong> {{freelancer.name}}</p>
            <p><strong>Date:</strong> {{signatures.freelancer.signedAt}}</p>
            <p><strong>IP Address:</strong> {{signatures.freelancer.ipAddress}}</p>
        </div>
        {{else}}
        <div class="signature-box">
            <h3>Freelancer Signature</h3>
            <p>Not yet signed</p>
        </div>
        {{/if}}
    </div>

    <div class="footer">
        <p><strong>FreelanceHub Platform</strong></p>
        <p>This contract was generated electronically and is legally binding.</p>
        <p>Contract generated on {{generatedAt}}</p>
    </div>
</body>
</html>
    `;
  }
}
