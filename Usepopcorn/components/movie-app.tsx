"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import { Search, X, ChevronLeft, Plus, Loader2 } from "lucide-react"
import { StarRating } from "./star-rating"
import { cn } from "@/lib/utils"

const average = (arr: number[]) => arr.reduce((acc, cur) => acc + cur / arr.length, 0)

const KEY = "f84fc31d"

interface Movie {
  imdbID: string
  Title: string
  Year: string
  Poster: string
  Runtime?: string
  imdbRating?: string
  Plot?: string
  Released?: string
  Actors?: string
  Director?: string
  Genre?: string
}

interface WatchedMovie {
  imdbID: string
  title: string
  year: string
  poster: string
  imdbRating: number
  runtime: number
  userRating: number
  countRatingDecisions: number
}

export default function MovieApp() {
  const [query, setQuery] = useState("")
  const [movies, setMovies] = useState<Movie[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const [watched, setWatched] = useState<WatchedMovie[]>(() => {
    if (typeof window !== "undefined") {
      const storedValue = localStorage.getItem("watched")
      return storedValue ? JSON.parse(storedValue) : []
    }
    return []
  })

  function handleSelectMovie(id: string) {
    setSelectedId((selectedId) => (id === selectedId ? null : id))
  }

  function handleCloseMovie() {
    setSelectedId(null)
  }

  function handleAddWatched(movie: WatchedMovie) {
    setWatched((watched) => [...watched, movie])
  }

  function handleDeleteWatched(id: string) {
    setWatched((watched) => watched.filter((movie) => movie.imdbID !== id))
  }

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("watched", JSON.stringify(watched))
    }
  }, [watched])

  useEffect(() => {
    const controller = new AbortController()

    async function fetchMovies() {
      try {
        setIsLoading(true)
        setError("")

        const res = await fetch(`https://www.omdbapi.com/?apikey=${KEY}&s=${query}`, { signal: controller.signal })

        if (!res.ok) throw new Error("Something went wrong with fetching movies")

        const data = await res.json()
        if (data.Response === "False") throw new Error("Movie not found")

        setMovies(data.Search || [])
        setError("")
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.log(err.message)
          setError(err.message)
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (query.length < 3) {
      setMovies([])
      setError("")
      return
    }

    handleCloseMovie()
    fetchMovies()

    return () => {
      controller.abort()
    }
  }, [query])

  return (
    <div className="flex flex-col min-h-screen">
      <NavBar>
        <Logo />
        <SearchInput query={query} setQuery={setQuery} />
        <NumResults movies={movies} />
      </NavBar>

      <Main>
        <Box>
          {isLoading && <LoadingSpinner />}
          {!isLoading && !error && <MovieList movies={movies} onSelectMovie={handleSelectMovie} />}
          {error && <ErrorMessage message={error} />}
        </Box>

        <Box>
          {selectedId ? (
            <MovieDetails
              selectedId={selectedId}
              onCloseMovie={handleCloseMovie}
              onAddWatched={handleAddWatched}
              watched={watched}
            />
          ) : (
            <>
              <WatchedSummary watched={watched} />
              <WatchedMoviesList watched={watched} onDeleteWatched={handleDeleteWatched} />
            </>
          )}
        </Box>
      </Main>
    </div>
  )
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full">
      <Loader2 className="w-10 h-10 animate-spin text-primary" />
    </div>
  )
}

function ErrorMessage({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center h-full">
      <p className="text-red-500 font-medium flex items-center gap-2">
        <span className="text-xl">⛔️</span> {message}
      </p>
    </div>
  )
}

function NavBar({ children }: { children: React.ReactNode }) {
  return <nav className="bg-slate-800 shadow-md py-4 px-6 flex flex-col md:flex-row items-center gap-4">{children}</nav>
}

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <span role="img" className="text-2xl">
        🍿
      </span>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-amber-500 to-pink-500 bg-clip-text text-transparent">
        usePopcorn
      </h1>
    </div>
  )
}

function SearchInput({ query, setQuery }: { query: string; setQuery: (query: string) => void }) {
  const inputEl = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function callback(e: KeyboardEvent) {
      if (document.activeElement === inputEl.current) return

      if (e.code === "Enter") {
        inputEl.current?.focus()
        setQuery("")
      }
    }

    document.addEventListener("keydown", callback)
    return () => document.removeEventListener("keydown", callback)
  }, [setQuery])

  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
      <input
        className="w-full bg-slate-700 rounded-full py-2 pl-10 pr-4 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all"
        type="text"
        placeholder="Search movies..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        ref={inputEl}
      />
    </div>
  )
}

function NumResults({ movies }: { movies: Movie[] }) {
  return (
    <p className="text-sm text-slate-300">
      Found <strong className="text-primary">{movies.length}</strong> results
    </p>
  )
}

function Main({ children }: { children: React.ReactNode }) {
  return <main className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 p-6 overflow-hidden">{children}</main>
}

function Box({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div className="bg-slate-800 rounded-xl shadow-lg overflow-hidden flex flex-col h-[600px] md:h-[700px]">
      <button
        className="self-end p-2 m-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
        onClick={() => setIsOpen((open) => !open)}
      >
        {isOpen ? "–" : "+"}
      </button>

      {isOpen && <div className="flex-1 overflow-auto">{children}</div>}
    </div>
  )
}

function MovieList({
  movies,
  onSelectMovie,
}: {
  movies: Movie[]
  onSelectMovie: (id: string) => void
}) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
      {movies?.map((movie) => (
        <Movie movie={movie} key={movie.imdbID} onSelectMovie={onSelectMovie} />
      ))}
    </ul>
  )
}

function Movie({
  movie,
  onSelectMovie,
}: {
  movie: Movie
  onSelectMovie: (id: string) => void
}) {
  return (
    <li
      onClick={() => onSelectMovie(movie.imdbID)}
      className="bg-slate-700 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all hover:scale-105 cursor-pointer"
    >
      <div className="aspect-[2/3] relative">
        <img
          src={movie.Poster !== "N/A" ? movie.Poster : "/placeholder.svg?height=300&width=200"}
          alt={`${movie.Title} poster`}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-sm line-clamp-1">{movie.Title}</h3>
        <div className="flex items-center mt-1">
          <span className="text-xs text-slate-400">🗓</span>
          <span className="text-xs ml-1 text-slate-300">{movie.Year}</span>
        </div>
      </div>
    </li>
  )
}

function MovieDetails({
  selectedId,
  onCloseMovie,
  onAddWatched,
  watched,
}: {
  selectedId: string
  onCloseMovie: () => void
  onAddWatched: (movie: WatchedMovie) => void
  watched: WatchedMovie[]
}) {
  const [movie, setMovie] = useState<Movie>({} as Movie)
  const [isLoading, setIsLoading] = useState(false)
  const [userRating, setUserRating] = useState(0)

  const countRef = useRef(0)

  useEffect(() => {
    if (userRating) countRef.current++
  }, [userRating])

  const isWatched = watched.map((movie) => movie.imdbID).includes(selectedId)
  const watchedUserRating = watched.find((movie) => movie.imdbID === selectedId)?.userRating

  const {
    Title: title = "",
    Year: year = "",
    Poster: poster = "",
    Runtime: runtime = "",
    imdbRating = "",
    Plot: plot = "",
    Released: released = "",
    Actors: actors = "",
    Director: director = "",
    Genre: genre = "",
  } = movie

  const isTop = Number(imdbRating) > 8

  function handleAdd() {
    const newWatchedMovie = {
      imdbID: selectedId,
      title,
      year,
      poster,
      imdbRating: Number(imdbRating),
      runtime: Number(runtime.split(" ")[0]),
      userRating,
      countRatingDecisions: countRef.current,
    }

    onAddWatched(newWatchedMovie)
    onCloseMovie()
  }

  useEffect(() => {
    function callback(e: KeyboardEvent) {
      if (e.code === "Escape") {
        onCloseMovie()
      }
    }

    document.addEventListener("keydown", callback)

    return () => {
      document.removeEventListener("keydown", callback)
    }
  }, [onCloseMovie])

  useEffect(() => {
    async function getMovieDetails() {
      setIsLoading(true)
      try {
        const res = await fetch(`https://www.omdbapi.com/?apikey=${KEY}&i=${selectedId}`)
        const data = await res.json()
        setMovie(data)
      } catch (err) {
        console.error(err)
      } finally {
        setIsLoading(false)
      }
    }
    getMovieDetails()
  }, [selectedId])

  useEffect(() => {
    if (!title) return
    document.title = `Movie | ${title}`

    return () => {
      document.title = "usePopcorn"
    }
  }, [title])

  return (
    <div className="h-full overflow-auto">
      {isLoading ? (
        <LoadingSpinner />
      ) : (
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <button
              className="p-2 rounded-full bg-slate-700 hover:bg-slate-600 transition-colors"
              onClick={onCloseMovie}
            >
              <ChevronLeft size={20} />
            </button>

            <div className="flex flex-col md:flex-row gap-6">
              <img
                src={poster !== "N/A" ? poster : "/placeholder.svg?height=300&width=200"}
                alt={`Poster of ${title} movie`}
                className="w-40 h-auto rounded-lg shadow-md object-cover"
              />

              <div>
                <h2 className="text-2xl font-bold mb-2">{title}</h2>
                {isTop && (
                  <span className="inline-block bg-amber-500 text-black text-xs font-semibold px-2 py-1 rounded mb-2">
                    TOP RATED
                  </span>
                )}
                <p className="text-slate-300 text-sm mb-1">
                  {released} • {runtime}
                </p>
                <p className="text-slate-300 text-sm mb-2">{genre}</p>
                <p className="text-amber-400 flex items-center gap-1 mb-4">
                  <span>⭐️</span>
                  <span className="font-semibold">{imdbRating}</span>
                  <span className="text-slate-400 text-xs">IMDb rating</span>
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className={cn("p-4 rounded-lg mb-4", isWatched ? "bg-slate-700" : "bg-slate-700")}>
              {!isWatched ? (
                <>
                  <p className="text-sm font-medium mb-2">Your rating</p>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <StarRating maxRating={10} size={24} onSetRating={setUserRating} defaultRating={0} />
                    {userRating > 0 && (
                      <button
                        className="flex items-center gap-1 bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-full transition-colors"
                        onClick={handleAdd}
                      >
                        <Plus size={16} />
                        Add to list
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <p className="flex items-center gap-2">
                  You rated this movie <span className="font-bold text-amber-400">{watchedUserRating}</span>{" "}
                  <span>⭐️</span>
                </p>
              )}
            </div>

            <p className="text-slate-300 italic mb-4">{plot}</p>
            <p className="text-slate-300 mb-2">Starring: {actors}</p>
            <p className="text-slate-300">Directed by: {director}</p>
          </div>
        </div>
      )}
    </div>
  )
}

function WatchedSummary({ watched }: { watched: WatchedMovie[] }) {
  const avgImdbRating = watched.length ? average(watched.map((movie) => movie.imdbRating)) : 0
  const avgUserRating = watched.length ? average(watched.map((movie) => movie.userRating)) : 0
  const avgRuntime = watched.length ? average(watched.map((movie) => movie.runtime)) : 0

  return (
    <div className="bg-slate-700 p-4 m-4 rounded-lg">
      <h2 className="text-xl font-bold mb-3">Movies you watched</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-800 p-3 rounded-lg text-center">
          <span className="block text-2xl mb-1">📽️</span>
          <span className="text-sm text-slate-300">Movies</span>
          <span className="block font-bold text-lg">{watched.length}</span>
        </div>
        <div className="bg-slate-800 p-3 rounded-lg text-center">
          <span className="block text-2xl mb-1">⭐️</span>
          <span className="text-sm text-slate-300">IMDb</span>
          <span className="block font-bold text-lg">{avgImdbRating.toFixed(1)}</span>
        </div>
        <div className="bg-slate-800 p-3 rounded-lg text-center">
          <span className="block text-2xl mb-1">🌟</span>
          <span className="text-sm text-slate-300">Your Rating</span>
          <span className="block font-bold text-lg">{avgUserRating.toFixed(1)}</span>
        </div>
        <div className="bg-slate-800 p-3 rounded-lg text-center">
          <span className="block text-2xl mb-1">⏳</span>
          <span className="text-sm text-slate-300">Runtime</span>
          <span className="block font-bold text-lg">{Math.round(avgRuntime)} min</span>
        </div>
      </div>
    </div>
  )
}

function WatchedMoviesList({
  watched,
  onDeleteWatched,
}: {
  watched: WatchedMovie[]
  onDeleteWatched: (id: string) => void
}) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
      {watched.map((movie) => (
        <WatchedMovie movie={movie} key={movie.imdbID} onDeleteWatched={onDeleteWatched} />
      ))}
    </ul>
  )
}

function WatchedMovie({
  movie,
  onDeleteWatched,
}: {
  movie: WatchedMovie
  onDeleteWatched: (id: string) => void
}) {
  return (
    <li className="bg-slate-700 rounded-lg overflow-hidden shadow-md flex">
      <img
        src={movie.poster !== "N/A" ? movie.poster : "/placeholder.svg?height=150&width=100"}
        alt={`${movie.title} poster`}
        className="w-20 h-auto object-cover"
      />
      <div className="p-3 flex-1 relative">
        <h3 className="font-semibold text-sm line-clamp-1">{movie.title}</h3>
        <div className="grid grid-cols-3 gap-1 mt-2">
          <p className="flex items-center text-xs">
            <span className="text-amber-400 mr-1">⭐️</span>
            <span>{movie.imdbRating.toFixed(1)}</span>
          </p>
          <p className="flex items-center text-xs">
            <span className="text-amber-400 mr-1">🌟</span>
            <span>{movie.userRating}</span>
          </p>
          <p className="flex items-center text-xs">
            <span className="text-slate-400 mr-1">⏳</span>
            <span>{movie.runtime} min</span>
          </p>
        </div>

        <button
          className="absolute top-2 right-2 p-1 rounded-full bg-slate-600 hover:bg-red-600 transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            onDeleteWatched(movie.imdbID)
          }}
          aria-label="Delete movie"
        >
          <X size={14} />
        </button>
      </div>
    </li>
  )
}

