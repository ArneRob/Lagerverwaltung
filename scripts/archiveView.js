import { loadArchive } from './state.js';

/* ═══════════════════════════════════════════════
   ARCHIVE VIEW
═══════════════════════════════════════════════ */

/**
 * Flattens the archive into a sorted array of rows, one row per Kontrolleintrag.
 * Lager are sorted numerically. Within each Lager, entries are sorted by date.
 * The Lager cell is only filled on the first row of each Lager, empty thereafter.
 * @returns {Object[]} Array of row objects.
 */
function flattenArchiveToRows() {
    const archive = loadArchive();
    const rows = [];

    const lagerEntries = Object.entries(archive).sort((a, b) => {
        const numA = parseInt(a[0].replace(/\D/g, ''), 10);
        const numB = parseInt(b[0].replace(/\D/g, ''), 10);
        return numA - numB;
    });

    for (let i = 0; i < lagerEntries.length; i++) {
        const [lagerKey, lagerData] = lagerEntries[i];
        const dateEntries = Object.entries(lagerData).sort((a, b) => a[0].localeCompare(b[0]));
        let isFirstRowForLager = true;

        for (let j = 0; j < dateEntries.length; j++) {
            const [dateKey, grainData] = dateEntries[j];
            const grainEntries = Object.entries(grainData);

            for (let k = 0; k < grainEntries.length; k++) {
                const [grainKey, entry] = grainEntries[k];
                const partienStr = entry.partien.join(', ');

                if (entry.temperaturen.length === 0) {
                    rows.push({
                        lager:         isFirstRowForLager ? lagerKey : '',
                        geleertAm:     dateKey,
                        fruchtart:     grainKey,
                        partien:       partienStr,
                        kontrollDatum: '—',
                        von:           '—',
                        bis:           '—',
                        sicht:         '—',
                        massnahmen:    '—',
                        erfasstVon:    '—',
                    });
                    isFirstRowForLager = false;
                }

                for (let t = 0; t < entry.temperaturen.length; t++) {
                    const temp = entry.temperaturen[t];
                    rows.push({
                        lager:         isFirstRowForLager ? lagerKey : '',
                        geleertAm:     dateKey,
                        fruchtart:     grainKey,
                        partien:       partienStr,
                        kontrollDatum: temp.savedAtDisplay,
                        von:           `${temp.von}°C`,
                        bis:           `${temp.bis}°C`,
                        sicht:         temp.sicht || '—',
                        massnahmen:    temp.massnahmen || '—',
                        erfasstVon:    temp.savedBy || '—',
                    });
                    isFirstRowForLager = false;
                }
            }
        }
    }

    return rows;
}

/**
 * Builds and renders the archive table into the document body.
 * Called when the user clicks the "Import Archiv" button.
 */
export function importArchive() {
    const rows = flattenArchiveToRows();

    if (rows.length === 0) {
        alert('Kein Archiv vorhanden.');
        return;
    }

    const columns = [
        { key: 'lager',         label: 'Lager'          },
        { key: 'geleertAm',     label: 'Geleert am'     },
        { key: 'fruchtart',     label: 'Fruchtart'      },
        { key: 'partien',       label: 'Partien'        },
        { key: 'kontrollDatum', label: 'Kontrolldatum'  },
        { key: 'von',           label: 'Von'            },
        { key: 'bis',           label: 'Bis'            },
        { key: 'sicht',         label: 'Sichtkontrolle' },
        { key: 'massnahmen',    label: 'Maßnahmen'      },
        { key: 'erfasstVon',    label: 'Erfasst von'    },
    ];

    let html = '<table border="1" style="border-collapse:collapse;font-family:monospace;font-size:13px;width:100%">';
    html += '<thead><tr>';
    for (let i = 0; i < columns.length; i++) {
        html += `<th style="padding:6px 10px;background:#222;text-align:left">${columns[i].label}</th>`;
    }
    html += '</tr></thead><tbody>';

    for (let i = 0; i < rows.length; i++) {
        const isNewLager = rows[i].lager !== '';
        const bg = isNewLager ? '#1a1a2e' : (i % 2 === 0 ? '#111' : '#1a1a1a');
        html += `<tr style="background:${bg}">`;
        for (let j = 0; j < columns.length; j++) {
            const isBold = isNewLager && columns[j].key === 'lager';
            const style = `padding:5px 10px${isBold ? ';font-weight:bold' : ''}`;
            html += `<td style="${style}">${rows[i][columns[j].key]}</td>`;
        }
        html += '</tr>';
    }

    html += '</tbody></table>';
    document.body.innerHTML = html;
}
