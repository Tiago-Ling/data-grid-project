/**
 * Minimal CSV parser to avoid third-party dependencies.
 * Implements RFC 4180 CSV parsing with quote and comma handling.
 */

export interface CSVParseOptions {
    header?: boolean;
    skipEmptyLines?: boolean;
    dynamicTyping?: boolean;
}

export interface CSVParseResult<T = any> {
    data: T[];
    errors: Array<{ message: string; row: number }>;
}

/**
 * Fetches and parses a CSV file from a URL
 * @param url - URL to fetch CSV from
 * @param options - Parsing options
 * @returns Promise resolving to parsed data
 */
export async function parseCSV<T = any>(
    url: string,
    options: CSVParseOptions = {}
): Promise<CSVParseResult<T>> {
    const { header = true, skipEmptyLines = true, dynamicTyping = true } = options;

    try {
        // Fetch CSV content
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();

        // Parse CSV text
        const lines = parseCSVText(text);

        if (lines.length === 0) {
            return { data: [], errors: [] };
        }

        const errors: Array<{ message: string; row: number }> = [];
        let data: T[];

        if (header) {
            // First line is header
            const headers = lines[0];
            const dataLines = lines.slice(1);

            data = dataLines
                .map((line, index) => {
                    if (skipEmptyLines && isEmptyLine(line)) {
                        return null;
                    }

                    try {
                        return lineToObject<T>(headers, line, dynamicTyping);
                    } catch (e) {
                        errors.push({
                            message: `Failed to parse row ${index + 2}: ${e}`,
                            row: index + 2
                        });
                        return null;
                    }
                })
                .filter((row): row is T => row !== null);
        } else {
            // No header, return arrays
            data = lines
                .filter(line => !skipEmptyLines || !isEmptyLine(line))
                .map(line => {
                    if (dynamicTyping) {
                        return line.map(convertValue) as T;
                    }
                    return line as T;
                });
        }

        return { data, errors };
    } catch (error) {
        throw new Error(`Failed to fetch or parse CSV: ${(error as Error).message}`);
    }
}

function parseCSVText(text: string): string[][] {
    const lines: string[][] = [];
    let currentRow: string[] = [];
    let currentField = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (inQuotes) {
            if (char === '"') {
                if (nextChar === '"') {
                    // Escaped quote (double quote)
                    currentField += '"';
                    i++; // Skip next quote
                } else {
                    // End of quoted field
                    inQuotes = false;
                }
            } else {
                // Inside quotes, add everything (including commas and newlines)
                currentField += char;
            }
        } else {
            if (char === '"') {
                // Start of quoted field
                inQuotes = true;
            } else if (char === ',') {
                // Field separator
                currentRow.push(currentField.trim());
                currentField = '';
            } else if (char === '\n') {
                // End of line (handle both \n and \r\n)
                if (text[i - 1] === '\r') {
                    // Already handled \r, just process \n
                }
                currentRow.push(currentField.trim());
                if (currentRow.length > 0) {
                    lines.push(currentRow);
                }
                currentRow = [];
                currentField = '';
            } else if (char === '\r') {
                // Carriage return (part of \r\n or standalone)
                if (nextChar !== '\n') {
                    // Standalone \r, treat as line ending
                    currentRow.push(currentField.trim());
                    if (currentRow.length > 0) {
                        lines.push(currentRow);
                    }
                    currentRow = [];
                    currentField = '';
                }
                // If followed by \n, will be handled on next iteration
            } else {
                // Regular character
                currentField += char;
            }
        }
    }

    // Handle last field and row
    if (currentField || currentRow.length > 0) {
        currentRow.push(currentField.trim());
        if (currentRow.length > 0) {
            lines.push(currentRow);
        }
    }

    return lines;
}

function lineToObject<T>(headers: string[], values: string[], dynamicTyping: boolean): T {
    const obj: any = {};

    headers.forEach((header, index) => {
        const value = values[index] || '';
        obj[header] = dynamicTyping ? convertValue(value) : value;
    });

    return obj as T;
}

function convertValue(value: string): string | number | undefined {
    const trimmed = value.trim();

    if (trimmed === '') {
        return undefined;
    }

    // Try to convert to number
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== '') {
        return num;
    }

    return trimmed;
}

function isEmptyLine(line: string[]): boolean {
    return line.every(field => field.trim() === '');
}
