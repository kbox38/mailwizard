export const CONTACT_IMPORT_FIELDS = ['email', 'first_name', 'last_name', 'company', 'role', 'industry'] as const;

type ContactImportField = typeof CONTACT_IMPORT_FIELDS[number];
export type ImportedContact = {
  user_id: string;
  status: 'active';
  email: string;
} & Partial<Record<Exclude<ContactImportField, 'email'>, string>>;

export function mapContactRows(
  rows: Record<string, string>[],
  columnMapping: Record<string, string>,
  userId: string,
): ImportedContact[] {
  const contacts: ImportedContact[] = [];
  for (const row of rows) {
    const fields: Partial<Record<ContactImportField, string>> = {};
    for (const [column, field] of Object.entries(columnMapping)) {
      // A skipped column must never become an empty/unknown database field.
      if (!CONTACT_IMPORT_FIELDS.includes(field as ContactImportField)) continue;
      const value = row[column];
      if (typeof value === 'string' && value.trim()) {
        fields[field as ContactImportField] = value.trim();
      }
    }
    if (fields.email) {
      contacts.push({ ...fields, email: fields.email.toLowerCase(), user_id: userId, status: 'active' });
    }
  }
  return contacts;
}
