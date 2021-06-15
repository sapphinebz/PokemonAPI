import React from 'react'
import { BehaviorSubject, from, Observable, of, Subscription } from 'rxjs'
import { ajax } from 'rxjs/ajax'
import { concatMap, map, shareReplay, startWith, switchMap } from 'rxjs/operators'
import './App.css'
import { Pokemon, PokemonByUrl, PokeResponse } from './poke'
import PokemonImage from './PokemonImage'

interface AppState {
	pokemonList: Pokemon[]
	pokemonByName: { [pokemonName: string]: PokemonByUrl }
}

interface LazyLoadEvent {
	offset: number
	limit: number
}

const HTTP_POKEMON = {
	getPokemonLazyLoad(offset: number, limit: number) {
		return ajax
			.getJSON<PokeResponse>(
				`https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`
			)
			.pipe(map((response) => response.results))
	},

	getPokemonByUrl(url: string) {
		if(url){
			return ajax.getJSON<PokemonByUrl>(url)
		}else{
			return of({}) as Observable<PokemonByUrl>;
		}
	},
}

class App extends React.Component<any, AppState> {
	private pageAction = new BehaviorSubject<LazyLoadEvent>({
		limit: 10,
		offset: 0,
	})
	pokemonLazyLoad$ = this.pageAction.pipe(
		switchMap((pagination) => {
			// const pokemonContext = this.context as typeof HTTP_POKEMON
			return HTTP_POKEMON.getPokemonLazyLoad(
				pagination.offset,
				pagination.limit
			).pipe(startWith(Array.from({length:pagination.limit},(_)=>({url: ''} as Pokemon))))
		}),
		shareReplay(1)
	)

	imagePokemonConcat$ = this.pokemonLazyLoad$.pipe(
		switchMap((pokemonList) => {
			const pokemonByUrlMap: AppState['pokemonByName'] = {}
			return from(pokemonList).pipe(
				concatMap((pokemon) => HTTP_POKEMON.getPokemonByUrl(pokemon.url)),
				map((pokemonUrl) => {
					if(pokemonUrl.name){
						pokemonByUrlMap[pokemonUrl.name] = pokemonUrl
					}
					return pokemonByUrlMap
				})
			)
		}),
		shareReplay(1)
	)

	subscription = new Subscription()

	constructor(props: any) {
		super(props)
		this.state = { pokemonList: [], pokemonByName: {} }
	}

	componentDidMount() {
		this.subscription.add(
			this.pokemonLazyLoad$.subscribe((pokemonList) =>
				this.setState({ pokemonList })
			)
		)
		this.imagePokemonConcat$.subscribe((pokemon) =>
			this.setState({ pokemonByName: pokemon })
		)
	}
	componentWillUnmount() {
		this.subscription.unsubscribe()
	}

	findSprite(pokemonName: string) {
		const pokemon = this.state.pokemonByName[pokemonName]
		if (pokemon) {
			return <PokemonImage pokemon={pokemon}></PokemonImage>
		} else {
			return <div className='loader'></div>
		}
	}

	renderPokemonList() {
		return this.state.pokemonList.map((pokemon) => {
			return (
				<div className='display_container' key={pokemon.name}>
					{this.findSprite(pokemon.name)}
					<span>{pokemon.name}</span>
				</div>
			)
		})
	}

	nextPage() {
		const current = this.pageAction.value
		current.offset += current.limit
		this.pageAction.next(current)
	}

	prevPage() {
		const current = this.pageAction.value
		current.offset =
			current.offset - current.limit <= 0 ? 0 : current.offset - current.limit
		this.pageAction.next(current)
	}

	changeRowPerPage(limit: number) {
		const current = this.pageAction.value
		current.limit = limit
		this.pageAction.next(current)
	}

	render() {
		return (
			<section>
				<header className='controlled_container'>
					<button onClick={() => this.prevPage()}>prev</button>
					<button onClick={() => this.nextPage()}>next</button>
					<select
						defaultValue='10'
						onChange={(event) =>
							this.changeRowPerPage(Number(event.target.value))
						}
					>
						<option>5</option>
						<option>10</option>
						<option>15</option>
						<option>20</option>
					</select>
				</header>
				<section className='container'>{this.renderPokemonList()}</section>
			</section>
		)
	}
}

export default App
