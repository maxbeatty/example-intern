import { add } from "../../src/example";

const { describe, it } = intern.getPlugin("interface.bdd");
const { expect } = intern.getPlugin("chai");

describe("Example", () => {
    it("should work", () => {
        expect(true).to.be.true;
    });

    describe("add", () => {
        it("adds two numbers", () => {
            expect(add(2, 2)).to.equal(4);
        });
    });
});
