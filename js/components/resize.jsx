import React from 'react';
import { layoutPercentChange } from '../actions/general';
import { changePercs } from '../reducers/layout';

/* an explanation of state vs props for this component
 *
 * props relate to the actual div percentages
 * state is used when we are dragging the handles
 * and represents the future div percentages
 * when handles are released, this.state.dragging -> false
 * and an action propogates which ends up changing the props
 */

export const Drag = React.createClass({
  propTypes: {
    rowPercs: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
    colPercs: React.PropTypes.arrayOf(React.PropTypes.number).isRequired,
    dispatch: React.PropTypes.func.isRequired,
    index: React.PropTypes.number.isRequired,
    isCol: React.PropTypes.bool.isRequired,
  },

  getInitialState: function () {
    return {
      rowPercs: this.props.rowPercs,
      colPercs: this.props.colPercs,
      dragging: false,
    };
  },

  componentDidMount: function () {
    this.div.addEventListener('mousedown', this.onMouseDown, true);
    window.addEventListener('resize', this.resizeFn, false);
    this.resizeFn();
  },

  // set up some document event listeners when dragging to catch the mouse move and mouse up
  componentDidUpdate: function (props, state) {
    if (this.state.dragging && !state.dragging) {
      document.addEventListener('mousemove', this.onMouseMove);
      document.addEventListener('mouseup', this.onMouseUp);
    } else if (!this.state.dragging && state.dragging) {
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mouseup', this.onMouseUp);
    }
  },

  componentWillUnmount() {
    window.removeEventListener('resize', this.resizeFn, false);
  },

  // calculate relative position to the mouse and set dragging=true
  onMouseDown: function (e) {
    // only left mouse button
    if (e.button !== 0) {
      return;
    }
    this.setState({
      dragging: true,
    });
    e.stopPropagation();
    e.preventDefault();
  },

  onMouseUp: function (e) {
    this.setState({ dragging: false });
    e.stopPropagation();
    e.preventDefault();
    this.props.dispatch(layoutPercentChange(this.props.isCol, this.props.index, this.state.pos));
  },

  onMouseMove: function (e) {
    if (!this.state.dragging) {
      return;
    }
    let pos; /* measured in percentages */
    if (this.props.isCol) {
      /* COLUMN */
      pos = 100 * (e.pageX / window.innerWidth);
      for (let i = 0; i < this.props.index; i++) {
        pos -= this.state.colPercs[i];
      }
      this.setState({
        colPercs: changePercs(this.state.colPercs, pos, this.props.index),
        pos,
      });
    } else {
      /* ROW */
      pos = 100 * (e.pageY / window.innerHeight);
      for (let i = 0; i < this.props.index; i++) {
        pos -= this.state.rowPercs[i];
      }
      this.setState({
        rowPercs: changePercs(this.state.rowPercs, pos, this.props.index),
        pos,
      });
    }

    e.stopPropagation();
    e.preventDefault();
  },

  render: function () {
    const margin = parseInt(getComputedStyle(document.body, null).margin, 10);
    const colPercs = this.state.dragging ? this.state.colPercs : this.props.colPercs;
    const rowPercs = this.state.dragging ? this.state.rowPercs : this.props.rowPercs;
    const z = 90;
    const halfIcon = 7.5;
    let leftPos;
    let topPos;
    let percAbove = 0;
    /* calculate the topPos and leftPos of this div */
    if (this.props.isCol) {
      let percLeft = 0;
      for (let i = 0; i <= this.props.index; i++) {
        percLeft += colPercs[i];
      }
      leftPos = (window.innerWidth * (percLeft / 100)) - halfIcon + margin;
      topPos = (window.innerHeight / 2); // + (this.props.index * 15);
    } else {
      // const toremove = ((this.props.index + 1) * 7) - 4; // WTF
      leftPos = (window.innerWidth / 2); // + (this.props.index * 50);
      for (let i = 0; i <= this.props.index; i++) {
        percAbove += rowPercs[i];
      }
      topPos = 'calc(' + this.makeVh(percAbove) + ' - ' + halfIcon.toString() + 'px + ' + margin.toString() + 'px - ' + ((percAbove / 100) * 3).toString() + 'px)';
    }
    let line = null;
    if (this.state.dragging) {
      if (this.props.isCol) {
        line = (
          <div
            style = {{
              height: '100%',
              width: '2px', /* Line width */
              backgroundColor: 'black',
              left: leftPos + halfIcon - 1,
              zIndex: z,
              position: 'absolute',
              top: 0,
              // left: leftPos,
            }}
          />
        );
      } else {
        line = (
          <div
            style = {{
              width: '100%',
              height: '2px', /* Line width */
              backgroundColor: 'black',
              left: 0,
              zIndex: z,
              position: 'absolute',
              top: 'calc(' + this.makeVh(percAbove) + ' + ' + margin.toString() + 'px - ' + ((percAbove / 100) * 3).toString() + 'px - 2px)',
            }}
          />
        );
      }
    }
    return (
      <div>
        <div
          className = "dragHandle"
          ref={(c) => this.div = c}
          style = {{
            position: 'absolute',
            width: '15',
            height: '15',
            cursor: this.props.isCol ? 'col-resize' : 'row-resize',
            // background: background,
            left: leftPos,
            top: topPos,
            zIndex: z,
          }}
        />
        {line}
      </div>
    );
  },

  /* Function to calculate cumulative position of each div from the sizes of those preceeding them */
  cumulativePosition: function (index, percs) {
    let cumPos = 0;
    for (let i = 0; i < index + 1; i++) {
      cumPos += percs[i];
    }
    // console.log("cumPos", index, percs, cumPos)
    return cumPos;
  },

  makeVh: function (n) {
    return (n.toString() + 'vh');
  },

  resizeFn: function () {
    this.forceUpdate();
  },
});
