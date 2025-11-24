# Data Grid Project

Simple data grid example written in pure Typescript, inspired by the amazing [AG Grid](https://www.ag-grid.com/). The goal of this project is to have fun implementing various features while understanding the internals and challenges of high-performance data grids.

## Implementation Details

This grid follows a similar structure as AG Grid (although, of course, much simpler):
- Event-driven
- Component-based (in this project components merge both view and controller for simplicity)
- MVC-inspired (separation of the data model from the view and rendering logic)
- No framework dependencies (aside from Typescript and Vite for building)
- Uses ES2022 features
- GPU-accelerated row positioning

## Usage

1. Clone the repository, go to its root directory and run `npm i` in a terminal to install dependencies
2. While in the project's root directory, run the project with `vite` in a terminal.

## Features

### Current

- Row virtualization (only render visible rows)
- Rows with variable heights (logic is there, but still needs a demo)
- Column Sorting (single or multiple columns, hold shift when clicking columns for multi-sort)
- Column Filtering (single or multi-filter)
- Very simple custom event service

### Planned

- [X] Group rows by column values (the classic "Group By")
- [ ] Custom CellRenderers (w/ selection, editing, etc)
- [ ] Lazy loading data when scrolling (from server, disk, etc)
- [ ] Performance improvements and benchmark
- [ ] Column pinning (left and right)
- [ ] Column reordering via drag-and-drop
- [ ] Row pagination
- [ ] Footer
- [ ] Aggregation
- [ ] Pivoting
- [ ] Master-detail

### Project fixes and adjustments

- [X] Refactor HeaderComponent to extract and organise components (header cell renderer, filter popover, filter & sort buttons)
- [ ] Refactor `main.ts` and add proper test data <-- In progress
- [ ] Move all the different interfaces and types to appropriate places
- [ ] Better styling and more features for the main demo
- [X] Add a variable row heights to the demo (loads data from Open Food Facts, "guesstimates" row heights based on ingredients length)
- [ ] Add a real-time efficient cell data updates demo
- [ ] Extracting and organising the various default values