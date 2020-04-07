import { ReactNode } from 'react'
import { Element } from 'slate';


export type ElementProps = {
  attributes: { [key: string]: any },
  element: Element,
  children: ReactNode
}
