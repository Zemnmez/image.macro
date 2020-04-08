import image from '../../image.macro';
import 'jsdom-global/register';
import React from 'react';
import Enzyme, { mount } from 'enzyme';
import Adapter from 'enzyme-adapter-react-16';
Enzyme.configure({ adapter: new Adapter() });

const rsp = image('/mnt/c/Users/thoma/Documents/devel/image.macro/test.png') as any;

const Images = React.lazy(rsp.images);

describe('enzyme', () => {
    test('smoke', () => {
        mount(<div>hi!</div>)
    })
})

describe('image.macro', () => {
    test('suspense-smoke',  () => {
        mount(<React.Suspense fallback={() => "pls wait..."}>
            <div>hi!</div>
        </React.Suspense>)
    });

    test('gen',  () => {
        console.error(rsp)
    })
    test('render', () => {
        mount(<React.Suspense fallback={() => "pls wait..."}>
        <Images>
            {(v: any) => console.error(v)}
        </Images>
        </React.Suspense>)
    })
})