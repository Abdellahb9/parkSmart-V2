import { useEffect, useId, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../lib/cn';
import { compareText, fmtNumber } from '../../lib/format';
import { Button, Input, Skeleton } from './primitives';
import { AsyncState } from './feedback';

/**
 * One table for every list in the portal: search, sort, pagination and CSV
 * export, plus the three async states. Built once here so no page has to
 * re-implement them (and so none of them can be forgotten).
 *
 * columns: [{
 *   key,                         // property name, also the sort key
 *   header,                      // column label
 *   render?: (row) => ReactNode, // cell content; defaults to row[key]
 *   value?:  (row) => any,       // value used for sorting / search / CSV
 *   sortable?: boolean,
 *   exportable?: boolean,        // false to leave an action column out of the CSV
 *   align?: 'start' | 'end',
 *   wrap?: boolean,              // let prose (messages, addresses) wrap; values never do
 *   width?: string,              // e.g. '12rem'
 * }]
 */
export function DataTable({
  columns,
  rows,
  getRowId = (row, i) => row?._id ?? row?.id ?? i,
  loading = false,
  error = null,
  onRetry,
  searchable = true,
  searchPlaceholder,
  pageSize: initialPageSize = 10,
  csvFileName,
  toolbar,
  caption,
  emptyTitle,
  emptyDescription,
  onRowClick,
  className,
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const placeholder = searchPlaceholder ?? t('ui.table.search');
  const [sort, setSort] = useState({ key: null, dir: 'asc' });
  const [page, setPage] = useState(1);
  const pageSize = initialPageSize;
  const tableId = useId();

  const cellValue = (col, row) => (col.value ? col.value(row) : row?.[col.key]);

  // Search across every column's underlying value, not just the rendered node.
  const filtered = useMemo(() => {
    const list = Array.isArray(rows) ? rows : [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((row) =>
      columns.some((col) => {
        const v = cellValue(col, row);
        return v != null && String(v).toLowerCase().includes(q);
      })
    );
  }, [rows, query, columns]);

  const sorted = useMemo(() => {
    if (!sort.key) return filtered;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filtered;
    const factor = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = cellValue(col, a);
      const bv = cellValue(col, b);
      if (av == null && bv == null) return 0;
      if (av == null) return 1; // nulls last, both directions
      if (bv == null) return -1;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
      return compareText(av, bv) * factor;
    });
  }, [filtered, sort, columns]);

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const paged = useMemo(() => sorted.slice((page - 1) * pageSize, page * pageSize), [sorted, page, pageSize]);

  // Filtering can shrink the list under the current page.
  useEffect(() => {
    if (page > pageCount) setPage(1);
  }, [page, pageCount]);
  useEffect(() => {
    setPage(1);
  }, [query, sort.key, sort.dir]);

  const toggleSort = (key) =>
    setSort((s) => (s.key !== key ? { key, dir: 'asc' } : s.dir === 'asc' ? { key, dir: 'desc' } : { key: null, dir: 'asc' }));

  const exportCsv = () => {
    const esc = (v) => {
      const s = v == null ? '' : String(v);
      return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    // Action columns hold buttons, not data; they would export as empty.
    const exportCols = columns.filter((c) => c.exportable !== false);
    // Semicolons + BOM so French Excel opens it with columns and accents intact.
    const lines = [
      exportCols.map((c) => esc(c.header)).join(';'),
      ...sorted.map((row) => exportCols.map((c) => esc(cellValue(c, row))).join(';')),
    ];
    const blob = new Blob(['﻿' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = csvFileName || 'export.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const skeleton = (
    <div className="flex flex-col gap-2 p-4" aria-busy="true">
      {Array.from({ length: 6 }, (_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );

  const showToolbar = searchable || csvFileName || toolbar;

  return (
    <div className={cn('flex flex-col', className)}>
      {showToolbar && (
        <div className="flex flex-wrap items-end justify-between gap-3 pb-3">
          <div className="flex flex-wrap items-end gap-2">
            {searchable && (
              <div className="relative">
                <Search
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-y-0 start-3 my-auto size-4 text-text-muted"
                />
                <Input
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={placeholder}
                  aria-label={placeholder}
                  className="ps-9 w-64 max-w-full"
                />
              </div>
            )}
            {toolbar}
          </div>
          {csvFileName && (
            <Button variant="secondary" size="sm" onClick={exportCsv} disabled={!sorted.length}>
              <Download aria-hidden="true" className="size-4" />
              {t('ui.table.exportCsv')}
            </Button>
          )}
        </div>
      )}

      <AsyncState
        loading={loading}
        error={error}
        onRetry={onRetry}
        empty={!paged.length}
        skeleton={skeleton}
        emptyTitle={query ? t('ui.table.noResultsQuery') : (emptyTitle ?? t('ui.table.noResults'))}
        emptyDescription={query ? t('ui.table.tryAnother') : emptyDescription}
      >
        {() => (
          <>
            {/* The scroll container is what stops wide tables clipping. */}
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full border-collapse text-sm" id={tableId}>
                {caption && <caption className="sr-only">{caption}</caption>}
                <thead className="bg-surface-alt">
                  <tr>
                    {columns.map((col) => {
                      const isSorted = sort.key === col.key;
                      return (
                        <th
                          key={col.key}
                          scope="col"
                          style={col.width ? { width: col.width } : undefined}
                          aria-sort={isSorted ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                          className={cn(
                            'whitespace-nowrap px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-muted',
                            col.align === 'end' ? 'text-end' : 'text-start'
                          )}
                        >
                          {col.sortable === false ? (
                            col.header
                          ) : (
                            <button
                              type="button"
                              onClick={() => toggleSort(col.key)}
                              className="inline-flex items-center gap-1 rounded-sm hover:text-text focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                            >
                              {col.header}
                              {isSorted &&
                                (sort.dir === 'asc' ? (
                                  <ArrowUp aria-hidden="true" className="size-3.5" />
                                ) : (
                                  <ArrowDown aria-hidden="true" className="size-3.5" />
                                ))}
                            </button>
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {paged.map((row, i) => (
                    <tr
                      key={getRowId(row, i)}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      className={cn(
                        'border-t border-border',
                        onRowClick && 'cursor-pointer hover:bg-surface-alt'
                      )}
                    >
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn(
                            'px-4 py-3 text-text',
                            col.align === 'end' ? 'text-end' : 'text-start',
                            // A plate or a date split over two lines is misread, and
                            // Arabic labels run longer than French ones. The table
                            // scrolls horizontally instead.
                            !col.wrap && 'whitespace-nowrap'
                          )}
                        >
                          {col.render ? col.render(row) : cellValue(col, row)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
              <p className="text-sm text-text-muted" aria-live="polite">
                {t('ui.table.results', { count: sorted.length, n: fmtNumber(sorted.length) })}
                {pageCount > 1 && t('ui.table.page', { page: fmtNumber(page), pages: fmtNumber(pageCount) })}
              </p>
              {pageCount > 1 && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    aria-label={t('ui.table.prev')}
                  >
                    <ChevronLeft aria-hidden="true" className="size-4 rtl:rotate-180" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={page === pageCount}
                    aria-label={t('ui.table.next')}
                  >
                    <ChevronRight aria-hidden="true" className="size-4 rtl:rotate-180" />
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </AsyncState>
    </div>
  );
}

export default DataTable;
