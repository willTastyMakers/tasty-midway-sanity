import { Rule } from '@sanity/validation'

export const imageModule = {
  title: 'Image Module',
  name: 'imageModule',
  type: 'object',
  hidden: true,
  fields: [
    {
      name: 'image',
      title: 'Image',
      type: 'image',
      options: {
        hotspot: true
      },
      validation: (Rule: Rule)  => Rule.required()
    },
    {
      name: 'caption',
      title: 'Image Caption',
      type: 'text'
    },
    {
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          {title: 'Full', value: 'full'},
          {title: 'large', value: 'large'},
          {title: 'medium', value: 'medium'}
        ],
        layout: 'dropdown'
      }
    }
  ]
}
