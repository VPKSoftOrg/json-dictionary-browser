import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { App } from "../App";
import { AntdThemeProvider } from "../Context/AntdThemeContext";
import type { DictionaryTab } from "../Types/BaseTypes";

const renderApp = () =>
    render(
        <AntdThemeProvider>
            <App />
        </AntdThemeProvider>
    );

const storedTabs = (): DictionaryTab[] => JSON.parse(localStorage.getItem("dictionaries") ?? "null");

const clickOk = async () => {
    await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "OK" }));
    });
};

describe("App", () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it("shows an empty state when no dictionaries are open", () => {
        renderApp();

        expect(screen.getByText(/No dictionaries open/)).toBeTruthy();
    });

    it("opens a dictionary stored by an older version in a tab", () => {
        localStorage.setItem("dictionary", JSON.stringify([{ id: 0, name: "AFK" }]));
        localStorage.setItem("keys", JSON.stringify(["name"]));

        renderApp();

        expect(screen.getByRole("tab", { name: "Dictionary" })).toBeTruthy();
    });

    it("shows a tab for each stored dictionary and switches between them", () => {
        const tabs: DictionaryTab[] = [
            { key: "a", name: "Chat", dictionary: [], keys: ["name"] },
            { key: "b", name: "Words", dictionary: [], keys: ["name"] },
        ];
        localStorage.setItem("dictionaries", JSON.stringify(tabs));
        localStorage.setItem("activeDictionary", JSON.stringify("a"));

        renderApp();

        expect(screen.getByRole("tab", { name: "Chat" }).getAttribute("aria-selected")).toBe("true");

        fireEvent.click(screen.getByRole("tab", { name: "Words" }));

        expect(screen.getByRole("tab", { name: "Words" }).getAttribute("aria-selected")).toBe("true");
        expect(JSON.parse(localStorage.getItem("activeDictionary") ?? "null")).toBe("b");
    });

    it("creates a named new dictionary in a new tab", async () => {
        renderApp();

        fireEvent.click(screen.getByRole("button", { name: /New dictionary/ }));
        fireEvent.change(await screen.findByLabelText("Dictionary name"), { target: { value: "Slang" } });
        await clickOk();

        await waitFor(() => expect(screen.getByRole("tab", { name: "Slang" })).toBeTruthy());
        expect(storedTabs().map(f => [f.name, f.keys])).toEqual([["Slang", ["name", "value"]]]);
    });

    it("renames the active dictionary", async () => {
        const tabs: DictionaryTab[] = [{ key: "a", name: "Chat", dictionary: [], keys: ["name"] }];
        localStorage.setItem("dictionaries", JSON.stringify(tabs));

        renderApp();

        fireEvent.click(screen.getByRole("button", { name: /Rename dictionary/ }));
        fireEvent.change(await screen.findByLabelText("Dictionary name"), { target: { value: "Chat slang" } });
        await clickOk();

        await waitFor(() => expect(screen.getByRole("tab", { name: "Chat slang" })).toBeTruthy());
        expect(storedTabs()[0].name).toBe("Chat slang");
    });
});
