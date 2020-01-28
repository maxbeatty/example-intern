const { describe, it } = intern.getPlugin("interface.bdd");
const { expect } = intern.getPlugin("chai");

describe("Example", () => {
    it("should show basic form", async test => {
        const { remote } = test;

        await remote.get("https://example-intern.maxbeatty.now.sh/start.html");

        const previewIframe = await remote.findById("example-iframe");

        await remote.switchToFrame(previewIframe);

        const placeholder = await remote
            .findByName("name")
            .getAttribute("placeholder");

        expect(placeholder).to.equal("What is your name?");
    });

    it("should fill out the basic form", async test => {
        const { remote } = test;

        await remote.get("https://example-intern.maxbeatty.now.sh/start.html");

        const previewIframe = await remote.findById("example-iframe");

        await remote.switchToFrame(previewIframe);

        await remote.findByName("name").type("Max");

        await remote.switchToParentFrame();

        const text = await remote.findById("test").getVisibleText();

        expect(text).to.equal("this is a test");
    });
});
