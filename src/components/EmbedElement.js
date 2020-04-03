import React, {useState, useEffect} from 'react'

import auth from 'solid-auth-client'

import { makeStyles } from '@material-ui/core/styles';

import {BlockLoader} from './Loader';

const useStyles = makeStyles(theme => ({
  table: {
    border: "1px solid black",
    borderCollapse: "collapse"
  },
  tr: {
  },
  td: {
    border: `2px solid ${theme.palette.grey[300]}`,
    padding: theme.spacing(1)
  }
}))

const CSVEmbed = ({url}) => {
  const classes = useStyles()
  const [data, setData] = useState()
  const headerData = data && (data.length > 0) && data[0]
  const bodyData = data && (data.length > 0) && data.slice(1)
  useEffect(() => {
    async function loadData(){
      const response = await auth.fetch(url)
      if (response.ok){
        const text = await response.text()
        const rows = text.split("\n")
        setData(rows.map(row => row.split(",")))
      } else {
        console.log("data failed to load: ", response)
      }
    }
    loadData()
  }, [url])
  return data ? (
    <table className={classes.table}>
      <thead>
        <tr className={classes.tr}>
          {headerData.map((cell, i) => (
            <th key={i} className={classes.td}>{cell}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {bodyData.map((row, i) => (
          <tr key={i} className={classes.tr}>
            {row.map((cell, i) => (
              <td key={i} className={classes.td}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  ) : (
    <BlockLoader/>
  )
}

const Embed = ({type, url}) => {
  if (type === "text/csv") {
    return <CSVEmbed url={url}/>
  } else {
    return <p>Don't know how to display {url}</p>
  }
}

const EmbedElement = ({element, attributes, children,   ...props}) => {
  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <Embed url={element.url} type={element.embedType}/>
      </div>
      {children}
    </div>
  )
}

export default EmbedElement
