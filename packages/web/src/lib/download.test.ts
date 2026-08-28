import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { downloadTextFile } from './download';

describe('downloadTextFile', () => {
  const clicks: HTMLAnchorElement[] = [];
  let createObjectURL: ReturnType<typeof vi.fn>;
  let revokeObjectURL: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clicks.length = 0;
    createObjectURL = vi.fn(() => 'blob:mock');
    revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicks.push(this);
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('builds a blob URL, clicks a download anchor, and revokes the URL', () => {
    downloadTextFile('party.ics', 'BEGIN:VCALENDAR', 'text/calendar');

    expect(createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(clicks).toHaveLength(1);
    expect(clicks[0]!.getAttribute('download')).toBe('party.ics');
    expect(clicks[0]!.href).toContain('blob:mock');
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock');
    expect(document.querySelector('a[download]')).toBeNull();
  });
});
