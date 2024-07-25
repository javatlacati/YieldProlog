// Write to the HTML document, using <br> for newline.
export class HtmlDocumentWriter {


  write(text: string) {
    // Debug: should escape &lt;
    document.write(text);
  }

  writeLine(text: string) {
    if (text !== undefined)
      document.write(text);
    document.write("<br>");
  }

  close() {
  }

}