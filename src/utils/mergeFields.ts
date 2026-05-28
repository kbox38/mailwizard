interface Contact {
  first_name?: string;
  last_name?: string;
  email: string;
  company?: string;
  role?: string;
  industry?: string;
}

export function replacePersonalizationFields(
  htmlContent: string,
  contact: Contact
): string {
  let personalizedHtml = htmlContent;

  // Replace merge fields with actual data or fallback
  const replacements: Record<string, string> = {
    '{{firstname}}': contact.first_name || '[First Name]',
    '{{lastname}}': contact.last_name || '[Last Name]',
    '{{email}}': contact.email,
    '{{company}}': contact.company || '[Company]',
    '{{role}}': contact.role || '[Role]',
    '{{industry}}': contact.industry || '[Industry]'
  };

  Object.entries(replacements).forEach(([field, value]) => {
    const regex = new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    personalizedHtml = personalizedHtml.replace(regex, value);
  });

  return personalizedHtml;
}

export function validateContactData(
  contact: Contact,
  requiredFields: string[]
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  requiredFields.forEach(field => {
    const fieldMap: Record<string, keyof Contact> = {
      '{{firstname}}': 'first_name',
      '{{company}}': 'company',
      '{{role}}': 'role',
      '{{industry}}': 'industry'
    };

    const contactField = fieldMap[field];
    if (contactField && !contact[contactField]) {
      missingFields.push(field);
    }
  });

  return {
    valid: missingFields.length === 0,
    missingFields
  };
}