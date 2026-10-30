import type { Song } from './types'

/**
 * The README's song credits table, built from each song's source. A test checks the README
 * contains exactly this, so adding a song without crediting it fails.
 */
export function songCreditsTable(songs: Song[]): string {
  const rows = songs.map((song) => {
    const site = new URL(song.source.url).hostname.replace(/^www\./, '')
    return `| ${song.title} | ${song.genre} | [${site}](${song.source.url}) | ${song.source.credit} |`
  })
  return ['| Song | Genre | Source | Credit |', '| --- | --- | --- | --- |', ...rows].join('\n')
}
