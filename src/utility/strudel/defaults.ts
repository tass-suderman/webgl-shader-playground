export const DEFAULT_STRUDEL_TITLE = 'Strudel Pattern'

export const DEFAULT_STRUDEL_CODE = `
// Inspired by Switch Angel's Melodic Drum n Bass tutorial 
// https://www.youtube.com/watch?v=aPsq5nqvhxg
register('rlpf', (x,pat) => {return pat.lpf(pure(x).mul(12).pow(4))})
setGainCurve(x => Math.pow(x,2))
setcpm(170/4)

$drums: stack(
  s("bd:1").beat("0,7?,10",16).duck("3:4:5"),
  s("sd909:2").beat("4,12",16),
  s("hh:4!8")
  )
  // .rib(0,1/4)
  .orbit(2)._scope()

$bass: s("supersaw!8")
  .note("<c# f d# [d# a#2]>/2".sub("[12 0]")).fast(4).orbit(3)
  .rlpf(slider(1)).lpenv("2")

$riser: s("pulse!16").dec(.1).fm(time).fmh(time).orbit(5)
`

