import { render, screen } from "@testing-library/react";
import { AboutPopup } from "../Popups/AboutPopup";

describe("AboutPopup", () => {
    it("shows the copyright years and the version", () => {
        render(<AboutPopup visible darkMode={false} onClose={jest.fn()} />);

        expect(screen.getByText("JSON Dictionary Browser, Copyright © 2025-2026 VPKSoft, v.0.0.0-test")).toBeTruthy();
        expect(screen.getByText(/Copyright \(c\) 2025-2026 Petteri Kautonen/)).toBeTruthy();
    });
});
