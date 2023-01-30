import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import pactum from 'pactum';
import { AuthDto } from '../src/auth/dto/auth.dto.js';
import { EditUserDto } from '../src/user/dto/edit-user.dto.js';
import { CreateBookmarkDto, EditBookmarkDto } from '../src/bookmark/dto/index.js';


describe('App end2end test', ()=> {
  let app: INestApplication;
  let prisma: PrismaService;
  beforeAll(async ()=> {
    const moduleRef = await Test.createTestingModule({
     imports: [ AppModule ] 
    }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
    }));
    await app.init();
    await app.listen(4444);
    
    prisma = app.get(PrismaService)
    await prisma.cleanDb();
    pactum.request.setBaseUrl('http://localhost:4444')
  });
    
  afterAll(()=> {
    app.close();
  })


  describe('Auth', ()=> {
    const dto: AuthDto = {
      email: 'kim@gmail.com',
      password: '123'
    }
    describe('Signup', ()=> {
      it('Should throw error if email empty', ()=> {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            password: dto.password
          })
          .expectStatus(400)
      })
      it('Should throw error if password empty', ()=> {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody({
            email: dto.email
          })
          .expectStatus(400)
      })
      it('Should throw error if no body provide', ()=> {
        return pactum
          .spec()
          .post('/auth/signup')
          .expectStatus(400)
      })
      it('Should signup', ()=> {
        return pactum
          .spec()
          .post('/auth/signup')
          .withBody(dto)
          .expectStatus(201)
      })
    });

    describe('Signin', ()=> {
      it('Should throw error if email empty', ()=> {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            password: dto.password
          })
          .expectStatus(400)
      })
      it('Should throw error if password empty', ()=> {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody({
            email: dto.email
          })
          .expectStatus(400)
      })
      it('Should throw error if no body provide', ()=> {
        return pactum
          .spec()
          .post('/auth/signin')
          .expectStatus(400)
      })
      it('Should signin', ()=> {
        return pactum
          .spec()
          .post('/auth/signin')
          .withBody(dto)
          .expectStatus(200)
          .stores('userAt', "access_token") //Pactum provide direct store functionality so we don't have to create new variable.
      })
    });
  });

  describe('User', ()=> {
    describe('Get me', ()=> {
      it('Should get current user', ()=> {
        return pactum
          .spec()
          .get('/users/me')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
      })
    });

    describe('Edit user', ()=> {
      const dto: EditUserDto = {
        firstName : 'Shueiyang',
        email: 'yang@shuei.com'
      }
      it('Should edit user', ()=> {
        return pactum
          .spec()
          .patch('/users')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.firstName)
          .expectBodyContains(dto.email)
      })
    });
  });

  describe('Bookmarks', ()=> {
    describe('Get empty bookmark', ()=> {
      it('Should get all booksmarks', () => {
        return pactum
          .spec()
          .get('/bookmark')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
          .expectBody([])
      })
    });
    
    describe('Create bookmark', ()=> {
      const dto: CreateBookmarkDto = {
        title: "First Bookmark",
        link: "https://www.youtube.com/watch?v=GHTA143_b-s&t=4535s",
      }
      it('Should create booksmark', ()=> {
        return pactum
          .spec()
          .post('/bookmark')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .withBody(dto)
          .expectStatus(201)
          .stores('bookmarkId', "id")
      })
    });

    describe('Get bookmark', ()=> {
      it('Should get all booksmarks', () => {
        return pactum
          .spec()
          .get('/bookmark')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
          .expectJsonLength(1)
      })
    });

    describe('Get bookmark by id', ()=> {
      it('Should get bookmark by id', () => {
        return pactum
          .spec()
          .get('/bookmark/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
          .expectBodyContains('$S{bookmarkId}')     
      })
    });

    describe('Edit bookmark by id', ()=> {
      const dto: EditBookmarkDto = {
        title: 
          'NestJs Course for Beginners - Create a REST API',
        description: 
          'Learn NestJs by building a CRUD REST API with end-to-end tests using modern web development techniques. NestJs is a rapidly growing node js framework that helps build scalable and maintainable backend applications.'
      };
      it('Should edit bookmark', () => {
        return pactum
          .spec()
          .patch('/bookmark/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .withBody(dto)
          .expectStatus(200)
          .expectBodyContains(dto.title)
          .expectBodyContains(dto.description)     
      })
    });

    describe('Delete bookmark by id', ()=> {
      it('Should delete bookmark', () => {
        return pactum
          .spec()
          .delete('/bookmark/{id}')
          .withPathParams('id', '$S{bookmarkId}')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(204)
      });
      it('Should het empty bookmark', () => {
        return pactum
          .spec()
          .get('/bookmark')
          .withHeaders({
            Authorization: 'Bearer $S{userAt}'
          })
          .expectStatus(200)
          .expectJsonLength(0)
      })
    });
  });
});