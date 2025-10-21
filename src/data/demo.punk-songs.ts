export interface PunkSong {
  id: number
  name: string
  artist: string
}

const punkSongs: PunkSong[] = [
  { id: 1, name: 'London Calling', artist: 'The Clash' },
  { id: 2, name: 'God Save the Queen', artist: 'Sex Pistols' },
  { id: 3, name: 'Blitzkrieg Bop', artist: 'Ramones' },
  { id: 4, name: 'White Man In Hammersmith Palais', artist: 'The Clash' },
  { id: 5, name: 'Pretty Vacant', artist: 'Sex Pistols' },
  { id: 6, name: 'I Wanna Be Sedated', artist: 'Ramones' },
  { id: 7, name: 'Should I Stay or Should I Go', artist: 'The Clash' },
  { id: 8, name: 'Anarchy in the UK', artist: 'Sex Pistols' },
]

export async function getPunkSongs(): Promise<PunkSong[]> {
  // Simulate async data fetching
  return new Promise((resolve) => {
    setTimeout(() => resolve(punkSongs), 100)
  })
}
