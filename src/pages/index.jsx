import React, {useEffect, useState, useRef} from 'react'

import SpeechRecognition, { useSpeechRecognition } from 'react-speech-recognition';
import Speech from 'speak-tts'

import { Container, Grid, Button, Divider, Switch, Select, MenuItem } from "@mui/material"
import { Mic, MicOff} from '@mui/icons-material';

import socket from "../utils/socket";

function Home() {
  const {
    transcript,
    listening,
    finalTranscript,
    resetTranscript,
  } = useSpeechRecognition({ clearTranscriptOnListen: true});

  const [ text, setText] = useState('')
  const [ tts, setTts] = useState(true)
  const [ lastTranslations, setLastTranslations] = useState([])
  const [ configs, setConfigs ] = useState({
    voice_language: "en",
    voice_language_name: "English",
    translation_language: "pt",
    translation_language_name: "Portugues",
  })
  const messagesEndRef = useRef(null)


  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {scrollToBottom()}, [lastTranslations, text])

  useEffect(() => {
    socket.emit('teste', {text: transcript});
  }, [transcript]);

  useEffect(() => {
    socket.emit('final', {finalTranscript: finalTranscript});
  }, [finalTranscript]);

  useEffect(() => {
    socket.off('resTranslate').on('resTranslate', (e) => {
      if(e.text){
        setText(e.text.translation)
      }
    })
  }, [transcript]);

  useEffect(() => {
    socket.off('resFinal').on('resFinal', (e) => {
      if(e.finalText){
        setText(e.finalText.translation)
      }
      const speech = new Speech()
      if(e.text || e.finalText) {
        speech.init({
          'volume': tts ? 0.7 : 0.01,
          'lang': configs.translation_language,
          'rate': 1,
          'pitch': 1,
          'splitSentences': true,

          'listeners': {
            'onend': () => {
              console.log('askdjhas')
            }
          }
        }).then(() => {
          speech.speak({
            text: e.finalText.translation,

            listeners: {
              onstart: () => {
                SpeechRecognition.stopListening()
                setText(e.finalText.translation)
              },

              onend: () => {
                resetTranscript()
                setText('')
                
                SpeechRecognition.startListening({continuous: true, language: configs.voice_language})
                lastTranslations.push({
                  text: e.finalText.translation
                })
              }
            }
          })
        }).catch(e => {
            console.error("An error occured while initializing : ", e)
        })
      }
    });
  }, [tts, text, finalTranscript, lastTranslations])

  return (
    <Container maxWidth="md">
      <Grid container className='flex items-center justify-center'>
        <Grid item xs={12}>
          <Grid container item spacing={4} className='py-4 uppercase font-[Rubik] flex items-center justify-end'>
            <Grid item xs={4}>
              <div onClick={() => {
                  listening ? SpeechRecognition.stopListening() : SpeechRecognition.startListening({continuous: true, language: configs.voice_language})
                }} className={`flex items-center justify-center flex-col cursor-pointer hover:bg-[#1f2837] h-20 w-full px-5 py-1 rounded-lg ${!listening && "text-red-500"}`}>
                <div>{
                  listening ? <Mic /> : <MicOff />
                }</div>
                <div className='font-bold text-xs pt-1 uppercase'>
                  {listening ? "SILENCIAR" : "desilenciar"}
                </div>
              </div>
            </Grid>
            <Grid item xs={4}>
              <div className='flex items-center justify-center flex-col w-full'>
                <Switch color="secondary" checked={tts} onChange={(e) => {setTts(e.target.checked)}} />
                <div className='font-bold text-xs pt-1'>
                  Text To Speech?
                </div>
              </div>
            </Grid>
            <Grid item xs={4}>
              <div className='flex items-center justify-center flex-col w-full'>
                <Button variant="contained" className='font-[Rubik] font-bold w-6/12' color="secondary" onClick={() => {
                  resetTranscript()
                  setText('')
                }}>Reset</Button>
                <div className='font-bold text-xs pt-2'>
                  Reniciar a última frase
                </div>
                <div className='font-bold text-neutral-600 text-[10px]'>
                  (EM CASO DE BUG)
                </div>
              </div>
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <div className='py-4'>
            <div className='text-lg pb-3 pt-1 font-bold flex items-center justify-between'>
              <span>
                Original ({configs.voice_language_name}):
              </span>

              <div>
                <Select
                  variant="standard"
                  fullWidth
                  className='w-40 font-bold italic font-sm'
                  defaultValue="en"
                  onChange={(e, value) => {
                    setConfigs({
                      ...configs,
                      voice_language: value.props.value,
                      voice_language_name: value.props.children
                    })
                  }}
                >
                  <MenuItem value="pt">Português</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </div>
            </div>
            <div className={`text-xl text-neutral-300 p-3 bg-gray-900 rounded ${!transcript && "text-neutral-500"}`}>{transcript ? transcript : "Começe a falar para começar a tradução!"}</div>
            <div className='text-lg py-3 pt-3 font-bold flex items-center justify-between'>
              <span>
                Tradução ({configs.translation_language_name}):
              </span>

              <div>
                <Select
                  variant="standard"
                  fullWidth
                  className='w-40 font-bold italic font-sm'
                  defaultValue="pt-BR"
                  onChange={(e, value) => {
                    setConfigs({
                      ...configs,
                      translation_language: value.props.value,
                      translation_language_name: value.props.children
                    })

                    socket.emit('change_language', {language: value.props.value === "pt-BR" ? "pt" : value.props.value})
                  }}
                >
                  <MenuItem value="pt-BR">Português</MenuItem>
                  <MenuItem value="en">English</MenuItem>
                </Select>
              </div>
            </div>
            <div className='text-3xl bg-gray-800 p-3 rounded'>{text ? text : "Aqui sairá o resultadado da tradução!"}</div>
          </div>
        </Grid>
        <Grid item xs={12}>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <div className='pt-6'>
            <div className='flex items-center justify-between'>
              <div className='text-lg py-3 font-bold'>
                Últimas traduções:
              </div>
              <span>
                <Button 
                  variant='outlined'
                  color='secondary'
                  className='font-[Rubik] font-bold w-max text-[10px]'
                  onClick={() => {
                    setLastTranslations([])
                  }}
                >
                  RENICIAR Últimas traduções
                </Button>
              </span>
            </div>
            <div className='pb-3'>
              <div className='max-h-[265px] overflow-y-auto mr-2 pr-2 rounded ' id="scroller">
                {
                  lastTranslations.length > 0 ? (
                    <div>
                      {
                        lastTranslations.map((e, i) => (
                          <div className='odd:bg-gray-800 even:bg-gray-700 last:rounded-br first:rounded-tr text-base p-3' key={i}>
                            <span className='font-bold text-neutral-400'>Tradução:</span> {e.text}
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <div className='font-bold text-center text-lg text-neutral-600'>
                      Não há nenhuma tradução ainda!
                    </div>
                  )
                }
                <span ref={messagesEndRef}></span>
              </div>
            </div>
          </div>
        </Grid>
        <Grid item xs={12}>
          <Divider />
        </Grid>
        <Grid item xs={12}>
          <div>
            {
              !listening && (
                <div className='text-center text-5xl py-10 text-red-500 font-bold animate-pulse uppercase'>
                  NÃO FALE AINDA!
                  <div className='text-xs -animate text-red-400'>
                    dessilencie ou espere o tts acabar de falar!
                  </div>
                </div>
              )
            }
          </div>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Home