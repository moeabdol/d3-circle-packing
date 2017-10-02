import { Component, OnInit } from '@angular/core';

import * as d3 from 'd3';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  ngOnInit() {
    console.log('d3js version:', d3['version']);
    this.drawCirclePacking();
  }

  drawCirclePacking() {
    const svg = d3.select('svg');
    const margin = 20;
    const diameter = +svg.attr('width');
    const g = svg.append('g')
      .attr('transform', 'translate(' + diameter / 2 + ',' + diameter / 2 + ')');

    const color = d3.scaleLinear<string>()
      .domain([-1, 5])
      .range(['hsl(152, 80%, 80%)', 'hsl(228, 30%, 40%)'])
      .interpolate(d3.interpolateHcl);

    const pack = d3.pack()
      .size([diameter - margin, diameter - margin])
      .padding(2);

    d3.json('assets/flare.json', (err, data) => {
      if (err) { throw new Error('Bad data!'); }

      const root = d3.hierarchy(data)
        .sum((d: any) => d.size)
        .sort((a, b) => b.value - a.value);

      let focus = root;
      const nodes = pack(root).descendants();
      let view = null;

      const circle = g.selectAll('circle')
        .data(nodes)
        .enter().append('circle')
          .attr('class', d => d.parent ? d.children ? 'node' : 'node node--leaf' : 'node node--root')
          .style('fill', d => d.children ? color(d.depth) : null)
          .on('click', d => {
            if (focus !== d) {
              zoom(d);
              d3.event.stopPropagation();
            }
          });

      const text = g.selectAll('text')
        .data(nodes)
        .enter().append('text')
          .attr('class', 'label')
          .style('fill-opacity', d => d.parent === root ? 1 : 0)
          .style('display', d => d.parent === root ? 'inline' : 'none')
          .text((d: any) => d.data.name);

      const node = g.selectAll('circle, text');

      svg
        .style('background', color(-1))
        .on('click', () => zoom(root));

      zoomTo([root['x'], root['y'], root['r'] * 2 + margin]);

      function zoom(d) {
        const focus0 = focus;
        focus = d;

        const transition = d3.transition('zoomTransition')
          .duration(d3.event.altKey ? 7500 : 750)
          .tween('zoom', () => {
            const i = d3.interpolateZoom(view, [focus['x'], focus['y'], focus['r'] * 2 + margin]);
            return function(t) { zoomTo(i(t)); };
          });

        transition.selectAll('text')
          .filter(function(n) {
            return n['parent'] === focus || (this as any).style.display === 'inline';
          })
            .style('fill-opacity', n => n['parent'] === focus ? 1 : 0)
            .on('start', function(n) {
              if (n['parent'] === focus) {
                (this as any).style.display = 'inline';
              }
            })
            .on('end', function(n) {
              if (n['parent'] !== focus) {
                (this as any).style.display = 'none';
              }
            });
      }

      function zoomTo(v) {
        const k = diameter / v[2];
        view = v;
        node.attr('transform', d => 'translate(' + (d['x'] - v[0]) * k + ',' + (d['y'] - v[1]) * k + ')' );
        circle.attr('r', d => d['r'] * k);
      }
    });
  }
}
