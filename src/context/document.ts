import { createContext } from 'react';
import { Document } from '../utils/model'

export default createContext<Document | null>(null)
