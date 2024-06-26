function sum(arg0: number, arg1: number): number {
	return arg0 + arg1;
}

test("adds 1 + 2 to equal 3", () => {
	expect(sum(1, 2)).toBe(3);
});
