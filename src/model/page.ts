import { TripleDocument, TripleSubject, Reference } from 'tripledoc';
import {space, rdf, solid, schema, ldp} from 'rdf-namespaces';
import { fetchDocument } from 'tripledoc';


export class Workspace {
  constructor(public document: TripleDocument) {
  }

  get containerRef(): Reference | null {
    return this.document.getSubject(this.document.asRef()).getRef(space.storage);
  }

  private containerDocument: TripleDocument | null = null;
  async getContainerDocument() : Promise<TripleDocument | null> {
    if (!this.containerDocument) {
      const containerRef = this.containerRef;
      if (containerRef){
        this.containerDocument = await fetchDocument(containerRef);
      }
    }
    return this.containerDocument;
  }

  private container: TripleSubject | null = null
  async getContainer() : Promise<TripleSubject | null> {
    if (!this.container) {
      const containerDocument = await this.getContainerDocument();
      if (containerDocument) {
        this.container = containerDocument.getSubject(containerDocument.asRef())
      }
    }
    return this.container;
  }

  async getPages(): Promise<Page[]> {
    const container = await this.getContainer();
    return (container ? container.getAllRefs(ldp.contains) : []).
      map(pageRef => new Page(this, pageRef));
  }

  async getPageName(pageRef: Reference): Promise<string | null> {
    return this.document.getSubject(pageRef).getString(schema.name);
  }

  async setPageName(pageRef: Reference, value: string): Promise<void> {
    const page = this.document.getSubject(pageRef);
    page.setLiteral(schema.name, value)
    this.document.save([page])
  }
}

export class Page {
  constructor(public workspace: Workspace, public pageRef: Reference) {
    //this.workspace = workspaceDoc.getSubject(workspaceDoc.asRef());
    //this.details = detailDoc.getSubject(detailDoc.asRef());
  }

  private document: TripleDocument | null = null;
  async getDocument(): Promise<TripleDocument> {
    if (!this.document){
      this.document = await fetchDocument(this.pageRef);
    }
    return this.document;
  }

  async getSubject(): Promise<TripleSubject | null> {
    const document = await this.getDocument();
    if (document){
      return document.getSubject(this.pageRef);
    } else {
      return null;
    }
  }

  async getName(): Promise<string | null> {
    return this.workspace.getPageName(this.pageRef);
  }

  async getText(): Promise<string | null>  {
    const subject = await this.getSubject();
    if (subject){
      return subject.getString(schema.text);
    } else {
      return null;
    }
  }

  async setText(value: string): Promise<void> {
    const subject = await this.getSubject();
    const document = await this.getDocument();
    if (subject && document){
      subject.setLiteral(schema.text, value);
      this.document = await document.save([subject])
    }
  }

  async setName(value: string): Promise<void> {
    const subject = await this.getSubject();
    const document = await this.getDocument();
    if (subject && document){
      subject.setLiteral(schema.name, value);
      this.document = await document.save([subject])
      await this.workspace.setPageName(this.pageRef, value);
    }

  }
}
