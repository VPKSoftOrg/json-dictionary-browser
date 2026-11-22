import { fireEvent, render, screen } from "@testing-library/react";
import { DictionaryNamePopup } from "../Popups/DictionaryNamePopup";

describe("DictionaryNamePopup", () => {
    it("returns the trimmed new name when accepted", () => {
        const onClose = jest.fn();
        render(<DictionaryNamePopup visible name="Old name" onClose={onClose} />);

        const input = screen.getByLabelText("Dictionary name") as HTMLInputElement;
        expect(input.value).toBe("Old name");

        fireEvent.change(input, { target: { value: "  New name " } });
        fireEvent.click(screen.getByRole("button", { name: "OK" }));

        expect(onClose).toHaveBeenCalledWith(true, "New name");
    });

    it("does not accept an empty name", () => {
        const onClose = jest.fn();
        render(<DictionaryNamePopup visible name="Old name" onClose={onClose} />);

        fireEvent.change(screen.getByLabelText("Dictionary name"), { target: { value: "   " } });
        const okButton = screen.getByRole("button", { name: "OK" }) as HTMLButtonElement;

        expect(okButton.disabled).toBe(true);
    });

    it("reports a cancel", () => {
        const onClose = jest.fn();
        render(<DictionaryNamePopup visible name="Old name" onClose={onClose} />);

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

        expect(onClose).toHaveBeenCalledWith(false);
    });
});
