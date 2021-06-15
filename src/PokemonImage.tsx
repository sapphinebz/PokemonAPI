import React from 'react'
import { PokemonByUrl } from './poke'

interface PokemonImageState {
	index: number
	pokemon: PokemonByUrl
}

class PokemonImage extends React.Component<
	Partial<PokemonImageState>,
	PokemonImageState
> {
	sprites: string[] = []
	constructor(props: PokemonImageState) {
		super(props)
		let defaultIndex: number = 0
		this.sprites = Object.entries(props.pokemon.sprites)
			.filter(
				([propName, value]) =>
					Boolean(value) &&
					(propName.startsWith('front') || propName.startsWith('back'))
			)
			.map(([propName, value], index) => {
				if (propName === 'front_default') {
					defaultIndex = index
				}
				return value
			})
		this.state = { index: defaultIndex, pokemon: props.pokemon }
	}

	nextIndex() {
		let index = this.state.index
		if (index + 1 > this.sprites.length - 1) {
			index = 0
		} else {
			index++
		}
		this.setState({ index })
	}

	render() {
		return (
			<img
				className='pointer'
				src={this.sprites[this.state.index]}
				alt={this.state.pokemon.name}
				onClick={() => this.nextIndex()}
			></img>
		)
	}
}

export default PokemonImage
