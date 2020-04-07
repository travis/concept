import { createContext } from 'react';
import { Page } from '../utils/model'

export default createContext<Page | null>(null)
