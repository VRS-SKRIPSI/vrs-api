interface iCleanInput {
  clearExtraSpaces(str: string): string;
}

class CleanInput implements iCleanInput {
  /**
   * clearExtraSpaces
   */
  public clearExtraSpaces(str: string): string {
    return str.replace(/\s+/g, " ").trim().toLowerCase();
  }

  /**
   * removeSpaces
   */
  public removeSpaces(str: string) {
    return str.split(" ").join("");
  }
}

export default new CleanInput();
