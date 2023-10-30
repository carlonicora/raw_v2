export enum Colour {
	Black = "#000000",
	Gray = "#CFCFC4",
	Red = "#C23B22",
	Green = "#03C03C",
	Blue = "#779ECB",
	Yellow = "#FDFD96",
	Purple = "#966FD6",
}

export function successColour(successes: number): string {
	switch (successes) {
		case 0:
			return Colour.Red;
		case 1:
			return Colour.Yellow;
		case 2:
			return Colour.Gray;
		case 3:
			return Colour.Purple;
		case 4:
			return Colour.Blue;
		default:
			return Colour.Green;
	}
}
