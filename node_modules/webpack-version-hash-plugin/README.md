# WebpackVersionHashPlugin

Adds a json file to your webpack build with the webpack hash and time.

This can be used to help single page apps detect a new version.

## Usage

```
new WebpackVersionHashPlugin(options)
```

Default options:

```
{
  filename: 'version.json',
  include_date: true
}
```

## Output
```
{
  "date": "2016-06-28T16:12:32.092Z",
  "hash": "e7070b18542ac089c0486eeca5d52173"
}
```
